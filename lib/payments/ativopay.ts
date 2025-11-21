// lib/payments/ativopay.ts

const BASE_URL = process.env.ATIVO_PAY_BASE_URL!
const API_KEY = process.env.ATIVO_PAY_API_KEY!
const USER_AGENT = process.env.ATIVO_PAY_USER_AGENT || "AtivoB2B/1.0"
const WEBHOOK_URL = process.env.ATIVO_PAY_WEBHOOK_URL

type CreatePixParams = {
  amount: number // em centavos
  customer: {
    name: string
    email: string
    phone: string
    document: {
      type: "CPF" | "CNPJ"
      number: string
    }
  }
  items: {
    title: string
    quantity: number
    unitPrice: number // em centavos
    tangible: boolean
    externalRef?: string
  }[]
  expiresInDays: number
  metadata?: string
  traceable?: boolean
  postbackUrl?: string
}

export async function createPixTransaction(params: CreatePixParams) {
  console.log("ATIVO BASE_URL:", BASE_URL)
  console.log("ATIVO API_KEY setada?:", !!API_KEY)
  console.log("ATIVO USER_AGENT:", USER_AGENT)
  console.log("ATIVO WEBHOOK_URL (.env):", WEBHOOK_URL)

  if (!BASE_URL || !API_KEY) {
    throw new Error("ATIVO_PAY_BASE_URL ou ATIVO_PAY_API_KEY não configurados")
  }

  const url = `${BASE_URL}/user/transactions`

  const candidatePostback = params.postbackUrl || WEBHOOK_URL || undefined

  const safePostbackUrl =
    candidatePostback && candidatePostback.startsWith("https://")
      ? candidatePostback
      : undefined

  const body: any = {
    pix: {
      expiresInDays: params.expiresInDays,
    },
    items: params.items,
    amount: params.amount,
    currency: "BRL",
    customer: {
      name: params.customer.name,
      email: params.customer.email,
      phone: params.customer.phone,
      document: {
        type: params.customer.document.type,
        number: params.customer.document.number,
      },
    },
    metadata: params.metadata ?? "",
    traceable: params.traceable ?? true,
    paymentMethod: "PIX",
  }

  if (safePostbackUrl) {
    body.postbackUrl = safePostbackUrl
  }

  console.log("PAYLOAD PARA ATIVOPAY:", JSON.stringify(body, null, 2))

  const headers = {
    "x-api-key": API_KEY,
    "User-Agent": USER_AGENT,
    "Content-Type": "application/json",
    Accept: "application/json",
  }

  console.log("HEADERS PARA ATIVOPAY (sem API key):", {
    ...headers,
    "x-api-key": "*****",
  })

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })

  const text = await res.text()
  console.log("ATIVOPAY RAW TEXT:", text)

  if (!res.ok) {
    console.error("ERRO ATIVOPAY STATUS:", res.status)
    console.error("ERRO ATIVOPAY BODY:", text)
    throw new Error(`Erro AtivoPay: ${text}`)
  }

  let data: any = {}
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error("Resposta da AtivoPay não é um JSON válido")
  }

  console.log("ATIVOPAY JSON PARSED:", JSON.stringify(data, null, 2))

  // algumas APIs retornam em data.data, outras direto em data
  const tx = data.data ?? data ?? {}

  const pixObj: any = tx.pix || {}

  // 👇 AQUI é o ponto crítico: inclui também qrcode e variações
  const pixCopiaECola =
    tx.qrCode ||            // raiz CamelCase
    tx.qrcode ||            // raiz minúscula, se vier
    tx.pixCode ||           // outro nome comum
    pixObj.qrCode ||        // dentro de pix CamelCase
    pixObj.qrcode ||        // dentro de pix minúsculo (o que vemos no log)
    pixObj.emv ||           // código EMV
    pixObj.brCode ||        // BR Code
    pixObj.pixCopy ||       // nome alternativo
    null

  const qrCodeBase64 =
    pixObj.qrCodeBase64 || tx.qrCodeBase64 || null

  const expiresAt =
    pixObj.expirationDate ||
    tx.expiresAt ||
    tx.expirationDate ||
    null

  return {
    raw: data,
    transactionId: tx.id ?? null,
    amount: tx.amount ?? null,
    status: tx.status ?? null,
    pixCopiaECola,
    qrCodeBase64,
    expiresAt,
  }
}
