// app/api/webhooks/ativopay/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Status da Ativo que vamos tratar como "pago"
const PAID_STATUSES = ["PAID", "APPROVED", "CONFIRMED"]

export async function POST(req: Request) {
  try {
    const bodyText = await req.text()

    // Log bruto pra debug
    console.log("WEBHOOK ATIVOPAY RAW BODY:", bodyText)

    let json: any
    try {
      json = JSON.parse(bodyText)
    } catch (e) {
      console.error("WEBHOOK ATIVOPAY: body não é JSON válido")
      return NextResponse.json(
        { ok: false, error: "Invalid JSON" },
        { status: 400 },
      )
    }

    // Normalização genérica: às vezes vem em data, às vezes em transaction
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

    // Possíveis campos que o gateway pode usar
    const gatewayId: string | null =
      tx.id || tx.transactionId || tx.transaction_id || null

    const externalRef: string | null =
      tx.externalRef ||
      tx.external_ref ||
      tx.orderId ||
      tx.order_id ||
      tx.metadata?.orderId ||
      null

    const rawStatus: string | null =
      tx.status || tx.currentStatus || tx.paymentStatus || null

    const statusUpper = rawStatus ? rawStatus.toString().toUpperCase() : null

    console.log("WEBHOOK ATIVOPAY NORMALIZADO:", {
      gatewayId,
      externalRef,
      rawStatus,
      statusUpper,
    })

    if (!statusUpper) {
      return NextResponse.json(
        { ok: false, error: "Missing status" },
        { status: 400 },
      )
    }

    // Se não for status de pago, apenas ignora com 200 OK
    if (!PAID_STATUSES.includes(statusUpper)) {
      console.log("WEBHOOK ATIVOPAY: status não é pago, ignorando:", rawStatus)
      return NextResponse.json({ ok: true, ignored: true })
    }

    // 1) Tenta localizar a transação pelo gatewayId
    let transaction = null

    if (gatewayId) {
      transaction = await prisma.transaction.findFirst({
        where: { gatewayId },
      })
    }

    let orderId: string | null = null

    if (transaction) {
      orderId = transaction.orderId
    } else if (externalRef) {
      // fallback: alguns gateways usam o externalRef como ID do pedido
      orderId = String(externalRef)
    }

    if (!transaction && !orderId) {
      console.error(
        "WEBHOOK ATIVOPAY: não encontrou transação nem orderId válido",
      )
      // Mesmo assim devolvemos 200 para não ficar reentregando webhook infinito
      return NextResponse.json({ ok: true, notFound: true })
    }

    // 2) Se tiver transação, marca como paid
    if (transaction) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "paid" },
      })
    }

    // 3) Se soubermos o orderId, marcamos o pedido como paid
    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "paid" },
      })
    }

    console.log("WEBHOOK ATIVOPAY: marcado como pago:", {
      transactionId: transaction?.id ?? null,
      orderId,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("ERRO WEBHOOK ATIVOPAY:", err)
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro inesperado" },
      { status: 500 },
    )
  }
}
