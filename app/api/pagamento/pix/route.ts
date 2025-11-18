import { NextResponse } from "next/server"
import { createPixTransaction } from "@/lib/payments/ativopay"
import { prisma } from "@/lib/prisma"
import { UNIT_PRICE_CENTS } from "@/app/config/pricing"

const MIN_NUMBERS = 100

export async function POST(req: Request) {
  try {
    const body = await req.json()

    console.log("REQUEST /api/pagamento/pix BODY:", body)

    // Quantidade solicitada
    const quantity = Number(body?.quantity ?? 0) || 0

    // -----------------------------
    // 1️⃣ Determina o total em centavos
    // -----------------------------
    let totalInCents = Number(body?.totalInCents ?? 0)

    if (!Number.isFinite(totalInCents)) {
      totalInCents = 0
    }

    // Fallbacks de segurança
    if (!totalInCents || totalInCents <= 0) {
      const rawAmount = body?.amountInCents ?? body?.amount
      const amountNum = Number(rawAmount)

      if (Number.isFinite(amountNum) && amountNum > 0) {
        totalInCents = Math.round(amountNum)
      } else if (quantity > 0) {
        totalInCents = quantity * UNIT_PRICE_CENTS
      }
    }

    if (!totalInCents || totalInCents <= 0) {
      console.error("❌ totalInCents inválido no backend:", {
        quantity,
        totalInCents,
        body,
      })
      return NextResponse.json(
        { ok: false, error: "Valor do pedido inválido" },
        { status: 400 },
      )
    }

    // Número mínimo apenas para controle de cópia/descrição
    const effectiveQty = Math.max(quantity, MIN_NUMBERS)

    const amountInCents = Math.round(totalInCents)

    const title = body?.itemTitle || `${effectiveQty} números`
    const customer = body?.customer || {}
    const documentType = (customer?.documentType as "CPF" | "CNPJ") || "CPF"

    // Normaliza CPF/telefone
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
    // 2️⃣ Garante usuário pelo CPF
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
        // corrida de criação, busca de novo
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
    // 3️⃣ Cria o pedido no banco
    // -----------------------------
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        amount: amountInCents / 100, // salva em reais
        status: "pending",
      },
    })

    // Se vierem números específicos, grava
    if (Array.isArray(body.numbers) && body.numbers.length > 0) {
      await prisma.ticket.createMany({
        data: body.numbers.map((n: number) => ({
          orderId: order.id,
          number: n,
        })),
      })
    }

    // -----------------------------
    // 4️⃣ Chama AtivoPay pra gerar o PIX
    // -----------------------------
    const resp = await createPixTransaction({
      amount: amountInCents, // sempre em centavos
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

    // ----------------------------------------------------------------
    // 4.1️⃣ Normaliza os campos, independente do formato da resposta
    // ----------------------------------------------------------------
    const data = (resp as any)?.data ?? resp

    const pixCopiaECola =
      (resp as any).pixCopiaECola ||
      data?.pixCopiaECola ||
      data?.payload || // AtivoPay costuma chamar assim
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

    // Se por algum motivo ainda não tiver o payload, devolve erro amigável
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
    // 5️⃣ Salva a transação ligada ao pedido
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
    // 6️⃣ Retorno pro front
    // -----------------------------
    return NextResponse.json(
      {
        ok: true,
        orderId: order.id,
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
