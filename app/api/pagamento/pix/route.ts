import { NextResponse } from "next/server"
import { createPixTransaction } from "@/lib/payments/ativopay"
import { prisma } from "@/lib/prisma"
import { UNIT_PRICE_CENTS } from "@/app/config/pricing"
import crypto from "crypto"
import { sendPushcutNotification } from "@/lib/pushcut"

const MIN_NUMBERS = 100

const PUSHCUT_ORDER_CREATED_URL = process.env.PUSHCUT_ORDER_CREATED_URL

// Helper pra SHA256 (recomendado pelo Facebook)
function sha256(value: string) {
  return crypto
    .createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex")
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    console.log("REQUEST /api/pagamento/pix BODY:", body)

    // -------------------------------------------------
    // 0) Dados de contexto pro CAPI (IP / User-Agent)
    // -------------------------------------------------
    const headers = req.headers
    const userAgent = headers.get("user-agent") || undefined
    const ipHeader =
      headers.get("x-forwarded-for") || headers.get("x-real-ip") || ""
    const clientIpAddress = ipHeader.split(",")[0]?.trim() || undefined

    // -------------------------------------------------
    // 1) TOTAL EM CENTAVOS
    // -------------------------------------------------
    let totalInCents = Number(body?.totalInCents ?? 0)

    if (!Number.isFinite(totalInCents) || totalInCents <= 0) {
      const rawAmount = body?.amountInCents ?? body?.amount
      const amountNum = Number(rawAmount)

      if (Number.isFinite(amountNum) && amountNum > 0) {
        totalInCents = Math.round(amountNum)
      } else {
        totalInCents = 0
      }
    }

    if (!totalInCents || totalInCents <= 0) {
      console.error("❌ totalInCents inválido no backend:", {
        totalInCents,
        body,
      })
      return NextResponse.json(
        { ok: false, error: "Valor do pedido inválido" },
        { status: 400 },
      )
    }

    // -------------------------------------------------
    // 2) QUANTIDADE REAL DE NÚMEROS
    // -------------------------------------------------
    const quantityFromNumbersArray =
      Array.isArray(body.numbers) && body.numbers.length > 0
        ? body.numbers.length
        : 0

    const quantityFromBodyRaw = body?.quantity
    const quantityFromBody =
      quantityFromBodyRaw !== undefined && quantityFromBodyRaw !== null
        ? Number(quantityFromBodyRaw) || 0
        : 0

    const quantityFromAmount =
      UNIT_PRICE_CENTS > 0
        ? Math.round(totalInCents / UNIT_PRICE_CENTS)
        : 0

    const effectiveQty =
      quantityFromNumbersArray ||
      quantityFromBody ||
      quantityFromAmount ||
      MIN_NUMBERS

    console.log("DEBUG QUANTIDADE:", {
      quantityFromNumbersArray,
      quantityFromBody,
      quantityFromAmount,
      effectiveQty,
      MIN_NUMBERS,
    })

    const amountInCents = Math.round(totalInCents)

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

    const title = body?.itemTitle || `${effectiveQty} números`

    // -------------------------------------------------
    // 3) Garante usuário pelo CPF
    // -------------------------------------------------
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

    // -------------------------------------------------
    // 4) Cria o pedido no banco
    // -------------------------------------------------
    console.log("CRIANDO ORDER COM:", {
      userId: user.id,
      amount: amountInCents / 100,
      quantity: effectiveQty,
    })

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        amount: amountInCents / 100, // em reais
        status: "pending",
        quantity: effectiveQty,
      },
    })

    // Se vierem números específicos, grava na Ticket
    if (Array.isArray(body.numbers) && body.numbers.length > 0) {
      await prisma.ticket.createMany({
        data: body.numbers.map((n: number) => ({
          orderId: order.id,
          number: n,
        })),
      })
    }

    // -------------------------------------------------
    // 5) Chama AtivoPay pra gerar o PIX
    // -------------------------------------------------
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
          externalRef: String(body?.externalRef || order.id),
        },
      ],
      expiresInDays: 1,
      metadata: body?.metadata || "",
      traceable: true,
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

    // -------------------------------------------------
    // 6) Transação no banco
    // -------------------------------------------------
    const transaction = await prisma.transaction.create({
      data: {
        orderId: order.id,
        value: amountInCents / 100,
        status: transactionStatus,
        gatewayId,
      },
    })

    // -------------------------------------------------
    // 6.1) Pushcut – Notificação de PEDIDO GERADO
    // -------------------------------------------------
    if (PUSHCUT_ORDER_CREATED_URL) {
      try {
        await sendPushcutNotification(PUSHCUT_ORDER_CREATED_URL, {
          type: "order_created",
          orderId: order.id,
          transactionId: transaction.id,
          amount: amountInCents / 100,
          quantity: effectiveQty,
          customerName: customer?.name || null,
          customerEmail: customer?.email || null,
          createdAt: new Date().toISOString(),
        })
      } catch (pushErr) {
        console.error("⚠️ Erro ao enviar notificação Pushcut:", pushErr)
        // não quebra o fluxo do pagamento
      }
    } else {
      console.warn("⚠️ PUSHCUT_ORDER_CREATED_URL não configurada. Pulando Pushcut.")
    }

    // -------------------------------------------------
    // 6.2) Facebook CAPI – InitiateCheckout
    // -------------------------------------------------
    const fbPixelId =
      process.env.FACEBOOK_PIXEL_ID ||
      process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ||
      ""

    const fbAccessToken = process.env.FACEBOOK_CAPI_TOKEN || ""
    const fbTestEventCode = process.env.FB_TEST_EVENT_CODE // opcional

    // event_id para deduplicação com o front
    const fbEventId = crypto.randomUUID()

    if (fbPixelId && fbAccessToken) {
      const eventTime = Math.floor(Date.now() / 1000)

      const userData: any = {}

      if (customer?.email) {
        userData.em = [sha256(String(customer.email))]
      }
      if (phone) {
        userData.ph = [sha256(phone)]
      }
      if (documentNumber) {
        userData.external_id = [sha256(documentNumber)]
      }
      if (clientIpAddress) {
        userData.client_ip_address = clientIpAddress
      }
      if (userAgent) {
        userData.client_user_agent = userAgent
      }

      const customData: any = {
        value: amountInCents / 100,
        currency: "BRL",
        num_items: effectiveQty,
        order_id: order.id,
        contents: [
          {
            id: String(order.id),
            quantity: effectiveQty,
            item_price: amountInCents / 100,
          },
        ],
        content_type: "product",
      }

      const payload: any = {
        data: [
          {
            event_name: "InitiateCheckout",
            event_time: eventTime,
            event_id: fbEventId,
            action_source: "website",
            event_source_url: body?.eventSourceUrl || undefined,
            user_data: userData,
            custom_data: customData,
          },
        ],
      }

      if (fbTestEventCode) {
        payload.test_event_code = fbTestEventCode
      }

      try {
        const url = `https://graph.facebook.com/v21.0/${fbPixelId}/events?access_token=${fbAccessToken}`

        const fbResp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })

        const fbJson = await fbResp.json()
        console.log("📡 FB CAPI InitiateCheckout resp:", fbJson)
      } catch (capErr) {
        console.error("❌ Erro ao enviar evento para Facebook CAPI:", capErr)
      }
    } else {
      console.warn(
        "⚠️ FACEBOOK_PIXEL_ID ou FACEBOOK_CAPI_TOKEN não configurados. Pulando envio CAPI.",
      )
    }

    // -------------------------------------------------
    // 7) Retorno pro front
    // -------------------------------------------------
    return NextResponse.json(
      {
        ok: true,
        orderId: order.id,
        quantity: effectiveQty,
        transactionId: transaction.id,
        pixCopiaECola,
        qrCodeBase64,
        expiresAt,
        // fbEventId pode ser usado no front para deduplicação com fbq
        fbEventId,
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
