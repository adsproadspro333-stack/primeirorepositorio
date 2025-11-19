// app/api/webhooks/ativopay/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Status da Ativo que vamos tratar como "pago"
const PAID_STATUSES = ["PAID", "APPROVED", "CONFIRMED"]

export async function POST(req: Request) {
  try {
    // Lê o corpo como texto pra logar certinho
    const bodyText = await req.text()

    console.log("WEBHOOK ATIVOPAY RAW BODY:", bodyText)

    let json: any
    try {
      json = bodyText ? JSON.parse(bodyText) : {}
    } catch (e) {
      console.error("WEBHOOK ATIVOPAY: body não é JSON válido:", e)
      return NextResponse.json(
        { ok: false, error: "Invalid JSON" },
        { status: 400 },
      )
    }

    // Pega o objeto da transação dentro do payload
    // baseado no formato mais comum da AtivoPay
    const tx = json?.data ?? json?.transaction ?? json

    if (!tx) {
      console.error(
        "WEBHOOK ATIVOPAY: sem campo data/transaction no payload:",
        json,
      )
      return NextResponse.json(
        { ok: false, error: "Invalid payload" },
        { status: 400 },
      )
    }

    const gatewayId: string | null =
      tx.id || tx.transactionId || tx.externalRef || null

    const status: string | null =
      tx.status || tx.transactionStatus || null

    console.log("WEBHOOK ATIVOPAY TX NORMALIZADO:", {
      gatewayId,
      status,
    })

    if (!gatewayId || !status) {
      console.error(
        "WEBHOOK ATIVOPAY: faltando gatewayId ou status:",
        { gatewayId, status },
      )
      return NextResponse.json(
        { ok: false, error: "Missing fields" },
        { status: 400 },
      )
    }

    // Se não for status considerado "pago", só ignora
    if (!PAID_STATUSES.includes(status.toUpperCase())) {
      console.log(
        "WEBHOOK ATIVOPAY: status não é pago, ignorando:",
        status,
      )
      return NextResponse.json({ ok: true, ignored: true })
    }

    // 1) Localiza transação pelo gatewayId (PODE não ser unique, por isso findFirst)
    const transaction = await prisma.transaction.findFirst({
      where: { gatewayId },
    })

    if (!transaction) {
      console.error(
        "WEBHOOK ATIVOPAY: não encontrou transação com gatewayId:",
        gatewayId,
      )
      // devolve 200 pra não ficar reentregando infinito
      return NextResponse.json({ ok: true, notFound: true })
    }

    // 2) Atualiza a transação para "paid"
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: "paid",
      },
    })

    // 3) Atualiza o pedido para "paid"
    const updatedOrder = await prisma.order.update({
      where: { id: transaction.orderId },
      data: {
        status: "paid",
        // se quiser, pode adicionar paidAt no futuro
        // paidAt: new Date(),
      },
    })

    console.log(
      "WEBHOOK ATIVOPAY: transação e pedido marcados como pagos:",
      {
        transactionId: updatedTransaction.id,
        orderId: updatedOrder.id,
      },
    )

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("ERRO WEBHOOK ATIVOPAY:", err)
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro inesperado" },
      { status: 500 },
    )
  }
}
