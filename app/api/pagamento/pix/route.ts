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

    // Se veio como string ou número quebrado, normaliza
    if (!Number.isFinite(totalInCents)) {
      totalInCents = 0
    }

    // Fallbacks em caso de não vir totalInCents (não deveria acontecer, mas deixamos à prova de falha)
    if (!totalInCents || totalInCents <= 0) {
      const rawAmount = body?.amountInCents ?? body?.amount
      const amountNum = Number(rawAmount)

      if (Number.isFinite(amountNum) && amountNum > 0) {
        totalInCents = Math.round(amountNum)
      } else if (quantity > 0) {
        // último fallback: 0,10 por número (caso extremo)
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

    // Número mínimo de cotas (apenas para controle; valor é o totalInCents calculado)
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

    // (Opcional) grava números específicos
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

    const pixCopiaECola = resp.pixCopiaECola || ""
    const qrCodeBase64 = resp.qrCodeBase64 || null
    const expiresAt = resp.expiresAt || null

    // -----------------------------
    // 5️⃣ Salva a transação ligada ao pedido
    // -----------------------------
    const transaction = await prisma.transaction.create({
      data: {
        orderId: order.id,
        value: amountInCents / 100,
        status: resp.status || "pending",
        gatewayId: resp.transactionId || "",
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
