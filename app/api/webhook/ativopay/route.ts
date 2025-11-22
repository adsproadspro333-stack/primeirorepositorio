// app/api/webhooks/ativopay/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Status que indicam pagamento confirmado
const PAID_STATUSES = [
  "PAID",
  "APPROVED",
  "CONFIRMED",
  "SUCCESS",
  "COMPLETED",
  "SUCCEEDED",
]

// Variáveis para Meta CAPI (Railway)
const FB_PIXEL_ID = process.env.FACEBOOK_PIXEL_ID
const FB_CAPI_TOKEN = process.env.FACEBOOK_CAPI_TOKEN
const SITE_URL =
  process.env.SITE_URL || "https://primeirorepositorio-production.up.railway.app"

export async function POST(req: Request) {
  try {
    const bodyText = await req.text()
    console.log("WEBHOOK RAW BODY:", bodyText)

    let json: any
    try {
      json = bodyText ? JSON.parse(bodyText) : {}
    } catch (e) {
      console.error("WEBHOOK: body não é JSON válido:", e)
      return NextResponse.json(
        { ok: false, error: "Invalid JSON" },
        { status: 400 },
      )
    }

    // Normalização do payload (Umbrella + Ativo)
    const tx =
      json?.data ||
      json?.transaction ||
      json?.object ||
      json?.payload ||
      json

    if (!tx) {
      console.error("WEBHOOK: payload inválido:", json)
      return NextResponse.json(
        { ok: false, error: "Invalid payload" },
        { status: 400 },
      )
    }

    const gatewayId: string | null =
      tx.id ||
      tx.objectId ||
      tx.transactionId ||
      tx.externalRef ||
      null

    const rawStatus: string | null =
      tx.status ||
      tx.paymentStatus ||
      tx.transactionStatus ||
      json?.event ||
      null

    const statusUpper = rawStatus ? rawStatus.toUpperCase() : null

    console.log("WEBHOOK NORMALIZADO:", {
      gatewayId,
      rawStatus,
      statusUpper,
    })

    if (!gatewayId || !rawStatus) {
      console.error("WEBHOOK: faltando gatewayId ou status", {
        gatewayId,
        rawStatus,
      })
      return NextResponse.json(
        { ok: false, error: "Missing fields" },
        { status: 400 },
      )
    }

    if (!statusUpper || !PAID_STATUSES.includes(statusUpper)) {
      console.log("WEBHOOK: status ignorado:", statusUpper)
      return NextResponse.json({ ok: true, ignored: true })
    }

    // 1) Busca transação pelo gatewayId
    const transaction = await prisma.transaction.findFirst({
      where: { gatewayId },
    })

    if (!transaction) {
      console.error("WEBHOOK: transação não encontrada:", gatewayId)
      return NextResponse.json({ ok: true, notFound: true })
    }

    // 2) Atualiza transação
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: "paid",
      },
    })

    // 3) Atualiza pedido
    const updatedOrder = await prisma.order.update({
      where: { id: transaction.orderId },
      data: {
        status: "paid",
      },
    })

    console.log("WEBHOOK: pagamento confirmado:", {
      transactionId: updatedTransaction.id,
      orderId: updatedOrder.id,
    })

    // ======================================================
    // 4) DISPARA EVENTO PURCHASE VIA META CAPI (SERVER-SIDE)
    // ======================================================
    if (FB_PIXEL_ID && FB_CAPI_TOKEN) {
      try {
        const eventTime = Math.floor(Date.now() / 1000)

        // garante que value é número
        const valueNumber =
          Number(updatedTransaction.value) ||
          Number(updatedOrder.amount) ||
          0

        const capiBody = {
          data: [
            {
              event_name: "Purchase",
              event_time: eventTime,
              action_source: "website",
              event_id: String(updatedTransaction.id), // ajuda na deduplicação futura
              event_source_url: `${SITE_URL}/pagamento-confirmado?orderId=${updatedOrder.id}`,
              custom_data: {
                currency: "BRL",
                value: valueNumber,
                order_id: updatedOrder.id,
                contents: [
                  {
                    id: String(updatedOrder.id),
                    quantity: updatedOrder.quantity ?? 1,
                    item_price: valueNumber,
                  },
                ],
                content_type: "product",
              },
              user_data: {
                // futuramente podemos enviar email/telefone hash aqui
                // ex: em: hashedEmail
              },
            },
          ],
        }

        const capiUrl = `https://graph.facebook.com/v21.0/${FB_PIXEL_ID}/events?access_token=${FB_CAPI_TOKEN}`

        const capiRes = await fetch(capiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(capiBody),
        })

        const capiText = await capiRes.text()
        console.log("META CAPI RESPONSE:", capiRes.status, capiText)
      } catch (err) {
        console.error("Erro ao enviar Purchase para Meta:", err)
        // não quebra o fluxo principal do webhook
      }
    } else {
      console.log("META CAPI não configurada (variáveis ausentes)", {
        FB_PIXEL_ID,
        FB_CAPI_TOKEN_EXISTE: !!FB_CAPI_TOKEN,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("ERRO WEBHOOK:", err)
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro inesperado" },
      { status: 500 },
    )
  }
}
