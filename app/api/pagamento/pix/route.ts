import { NextResponse } from "next/server"
import { createPixTransaction } from "@/lib/payments/ativopay"
import { prisma } from "@/lib/prisma"
import { UNIT_PRICE_CENTS } from "@/app/config/pricing"

const MIN_NUMBERS = 100

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("REQUEST /api/pagamento/pix BODY:", body)

    const quantity = Number(body?.quantity ?? 0) || 0
    let totalInCents = Number(body?.totalInCents ?? 0)

    if (!Number.isFinite(totalInCents) || totalInCents <= 0) {
      const rawAmount = body?.amountInCents ?? body?.amount
      const parsed = Number(rawAmount)

      if (parsed > 0) {
        totalInCents = Math.round(parsed)
      } else if (quantity > 0) {
        totalInCents = quantity * UNIT_PRICE_CENTS
      }
    }

    if (!totalInCents || totalInCents <= 0) {
      return NextResponse.json(
        { ok: false, error: "Valor do pedido inválido" },
        { status: 400 }
      )
    }

    const effectiveQty = Math.max(quantity, MIN_NUMBERS)
    const amountInCents = Math.round(totalInCents)

    const customer = body.customer || {}
    const title = body.itemTitle || `${effectiveQty} números`
    const documentType = customer.documentType || "CPF"

    const documentNumber = String(customer.documentNumber || "").replace(/\D/g, "")
    const phone = String(customer.phone || "").replace(/\D/g, "")

    if (!documentNumber) {
      return NextResponse.json(
        { ok: false, error: "CPF obrigatório" },
        { status: 400 }
      )
    }

    // Usuário
    let user = await prisma.user.findUnique({ where: { cpf: documentNumber } })
    if (!user) {
      user = await prisma.user.create({ data: { cpf: documentNumber } })
    }

    // Pedido
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        amount: amountInCents / 100,
        status: "pending",
      },
    })

    // Grava números se existirem
    if (Array.isArray(body.numbers) && body.numbers.length > 0) {
      await prisma.ticket.createMany({
        data: body.numbers.map((n: number) => ({
          orderId: order.id,
          number: n,
        })),
      })
    }

    // Criar PIX
    const resp = await createPixTransaction({
      amount: amountInCents,
      customer: {
        name: customer.name || "Cliente",
        email: customer.email || "cliente@example.com",
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
          externalRef: body.externalRef || order.id,
        },
      ],
      expiresInDays: 1,
      metadata: body.metadata || "",
      traceable: false,
    })

    console.log("RESPOSTA ATIVOPAY NORMALIZADA:", resp)

    // Agora SIM: pega exatamente o que o helper já trouxe
    const pixCopiaECola = resp.pixCopiaECola
    const qrCodeBase64 = resp.qrCodeBase64
    const expiresAt = resp.expiresAt
    const gatewayId = resp.transactionId
    const transactionStatus = resp.status || "pending"

    if (!pixCopiaECola) {
      console.error("❌ AtivoPay retornou resposta sem código PIX:", resp)
      return NextResponse.json(
        {
          ok: false,
          error: "Erro ao gerar código PIX. Tente novamente em instantes.",
        },
        { status: 502 }
      )
    }

    // Registrar transação
    const transaction = await prisma.transaction.create({
      data: {
        orderId: order.id,
        value: amountInCents / 100,
        status: transactionStatus,
        gatewayId,
      },
    })

    return NextResponse.json(
      {
        ok: true,
        orderId: order.id,
        transactionId: transaction.id,
        pixCopiaECola,
        qrCodeBase64,
        expiresAt,
      },
      { status: 200 }
    )
  } catch (err: any) {
    console.error("ERRO /api/pagamento:", err)
    return NextResponse.json(
      { ok: false, error: err.message || "Erro inesperado" },
      { status: 500 }
    )
  }
}
