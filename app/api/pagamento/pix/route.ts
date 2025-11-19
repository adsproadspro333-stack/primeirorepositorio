// app/api/pagamento/pix/route.ts
import { NextResponse } from "next/server"
import { createPixTransaction } from "@/lib/payments/ativopay"
import { prisma } from "@/lib/prisma"
import { UNIT_PRICE_CENTS } from "@/app/config/pricing"

const MIN_NUMBERS = 100

export async function POST(req: Request) {
  try {
    const body = await req.json()

    console.log("REQUEST /api/pagamento/pix BODY:", body)

    // -----------------------------
    // 1️⃣ QUANTIDADE ENVIADA PELO FRONT
    // -----------------------------
    const rawQuantity = body?.quantity
    const quantityFromBody = Number(rawQuantity ?? 0) || 0

    // Se o front mandar array de números (caso futuro / combos fixos)
    const quantityFromNumbersArray =
      Array.isArray(body?.numbers) && body.numbers.length > 0
        ? body.numbers.length
        : 0

    // Quantidade final:
    // - se tiver array de números, usa o length
    // - senão, usa o quantity normal (mas nunca menos que o mínimo)
    const effectiveQty =
      quantityFromNumbersArray ||
      Math.max(quantityFromBody, MIN_NUMBERS)

    // LOG DE DEBUG PRA GENTE VER NO RAILWAY
    console.log("QTY DEBUG /api/pagamento/pix:", {
      rawQuantity,
      quantityFromBody,
      quantityFromNumbersArray,
      effectiveQty,
    })

    // -----------------------------
    // 2️⃣ TOTAL EM CENTAVOS
    // -----------------------------
    let totalInCents = Number(body?.totalInCents ?? 0)

    if (!Number.isFinite(totalInCents)) {
      totalInCents = 0
    }

    if (!totalInCents || totalInCents <= 0) {
      const rawAmount = body?.amountInCents ?? body?.amount
      const amountNum = Number(rawAmount)

      if (Number.isFinite(amountNum) && amountNum > 0) {
        totalInCents = Math.round(amountNum)
      } else if (effectiveQty > 0) {
        // fallback pelo preço unitário padrão
        totalInCents = effectiveQty * UNIT_PRICE_CENTS
      }
    }

    if (!totalInCents || totalInCents <= 0) {
      console.error("❌ totalInCents inválido no backend:", {
        rawQuantity,
        quantityFromBody,
        quantityFromNumbersArray,
        effectiveQty,
        totalInCents,
        body,
      })
      return NextResponse.json(
        { ok: false, error: "Valor do pedido inválido" },
        { status: 400 },
      )
    }

    const amountInCents = Math.round(totalInCents)

    const title = body?.itemTitle || `${effectiveQty} números`
    const customer = body?.customer || {}
    const documentType = (customer?.documentType as "CPF" | "CNPJ") || "CPF"

    const documentNumber = String(customer?.documentNumber || "").replace(
      /\D/g,
      "",
    )
    const phone = String(customer?.phone || "").replace(/\D/g, "")

    if (!documentNumber) {
      return NextResponse.json(
        { ok: false, error: "CPF/CNPJ obrigatório" },
        { status: 400 },
      )
    }

    // -----------------------------
    // 3️⃣ Garante usuário pelo CPF
    // -----------------------------
    let user

    try {
      user = await prisma.user.findUnique({
        where: { cpf: documentNumber },
      })

      if (!user) {
        user = await prisma.user.create({
          data: { cpf: documentNumber },
        })
      }
    } catch (err: any) {
      if (err.code === "P2002") {
        user = await prisma.user.findUnique({
          where: { cpf: documentNumber },
        })
      } else {
        throw err
      }
    }

    if (!user) {
      throw new Error("Não foi possível criar/encontrar o usuário")
    }

    // -----------------------------
    // 4️⃣ Cria o pedido no banco (AGORA COM quantity)
    // -----------------------------
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        amount: amountInCents / 100, // em reais
        status: "pending",
        quantity: effectiveQty, // 👈 salvando a quantidade REAL
      },
    })

    if (Array.isArray(body.numbers) && body.numbers.length > 0) {
      await prisma.ticket.createMany({
        data: body.numbers.map((n: number) => ({
          orderId: order.id,
          number: n,
        })),
      })
    }

    // -----------------------------
    // 5️⃣ Chama AtivoPay pra gerar o PIX
    // -----------------------------
    const resp = await createPixTransaction({
      amount: amountInCents,
      customer: {
        name: customer?.name || "Cliente",
        email: customer?.email || "cliente@example.com",
        phone,
        document: {
          type: documentType,
          number: documentNumber,
        },
      },
      items: [
        {
          title,
          quantity: 1,
          tangible: false,
          unitPrice: amountInCents,
          externalRef: body?.externalRef || order.id,
        },
      ],
      expiresInDays: 1,
      metadata: body?.metadata || "",
      traceable: false,
    })

    console.log("RESPOSTA ATIVOPAY (createPixTransaction):", resp)

    const data = (resp as any)?.data ?? resp

    const pixCopiaECola =
      (resp as any).pixCopiaECola ||
      data?.pixCopiaECola ||
      data?.payload ||
      ""

    const qrCodeBase64 =
      (resp as any).qrCodeBase64 ||
      data?.qrCodeBase64 ||
      data?.qrCode ||
      null

    const expiresAt =
      (resp as any).expiresAt ||
      data?.expiresAt ||
      data?.expirationDate ||
      null

    const gatewayId =
      (resp as any).transactionId ||
      data?.transactionId ||
      data?.id ||
      ""

    const transactionStatus =
      (resp as any).status || data?.status || "pending"

    if (!pixCopiaECola) {
      console.error(
        "❌ AtivoPay não retornou payload/pixCopiaECola. Resposta completa:",
        resp,
      )
      return NextResponse.json(
        {
          ok: false,
          error:
            "PIX gerado no gateway, mas o código de pagamento não foi retornado pela API.",
        },
        { status: 502 },
      )
    }

    // -----------------------------
    // 6️⃣ Salva transação ligada ao pedido
    // -----------------------------
    const transaction = await prisma.transaction.create({
      data: {
        orderId: order.id,
        value: amountInCents / 100,
        status: transactionStatus,
        gatewayId,
      },
    })

    // -----------------------------
    // 7️⃣ Retorno pro front
    // -----------------------------
    return NextResponse.json(
      {
        ok: true,
        orderId: order.id,
        quantity: effectiveQty,
        transactionId: transaction.id,
        pixCopiaECola,
        qrCodeBase64,
        expiresAt,
      },
      { status: 200 },
    )
  } catch (err: any) {
    console.error("ERRO /api/pagamento:", err)
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Erro inesperado",
      },
      { status: 500 },
    )
  }
}
