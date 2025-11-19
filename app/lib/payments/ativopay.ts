// lib/payments/ativopay.ts

const BASE_URL = process.env.ATIVO_PAY_BASE_URL!;
const API_KEY = process.env.ATIVO_PAY_API_KEY!;
const USER_AGENT = process.env.ATIVO_PAY_USER_AGENT || "AtivoB2B/1.0";
const WEBHOOK_URL = process.env.ATIVO_PAY_WEBHOOK_URL;

type CreatePixParams = {
  amount: number; // em centavos
  customer: {
    name: string;
    email: string;
    phone: string;
    document: {
      type: "CPF" | "CNPJ";
      number: string;
    };
  };
  items: {
    title: string;
    quantity: number;
    unitPrice: number; // em centavos
    tangible: boolean;
    externalRef?: string;
  }[];
  expiresInDays: number;
  metadata?: string;
  traceable?: boolean;
  postbackUrl?: string;
};

export async function createPixTransaction(params: CreatePixParams) {
  // DEBUG pra ter certeza que as envs estão vindo
  console.log("ATIVO BASE_URL:", BASE_URL);
  console.log("ATIVO API_KEY setada?:", !!API_KEY);
  console.log("ATIVO USER_AGENT:", USER_AGENT);
  console.log("ATIVO WEBHOOK_URL (.env):", WEBHOOK_URL);

  if (!BASE_URL || !API_KEY) {
    throw new Error("ATIVO_PAY_BASE_URL ou ATIVO_PAY_API_KEY não configurados");
  }

  const url = `${BASE_URL}/api/user/transactions`; // endpoint da doc

  // Decide o postbackUrl efetivo (params > env)
  const candidatePostback = params.postbackUrl || WEBHOOK_URL || undefined;

  // Só aceita HTTPS (pra não tomar 403)
  const safePostbackUrl =
    candidatePostback && candidatePostback.startsWith("https://")
      ? candidatePostback
      : undefined;

  const body: any = {
    pix: {
      expiresInDays: params.expiresInDays,
    },
    items: params.items,
    amount: params.amount, // centavos
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
    traceable: params.traceable ?? false,
    paymentMethod: "PIX",
  };

  // Só envia postbackUrl se for HTTPS válido
  if (safePostbackUrl) {
    body.postbackUrl = safePostbackUrl;
  }

  // Logs úteis pro suporte
  console.log("PAYLOAD PARA ATIVOPAY:", JSON.stringify(body, null, 2));

  const headers = {
    "x-api-key": API_KEY, // EXATAMENTE COMO NA DOC
    "User-Agent": USER_AGENT, // "AtivoB2B/1.0"
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  console.log("HEADERS PARA ATIVOPAY (sem API key):", {
    ...headers,
    "x-api-key": "*****",
  });

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const text = await res.text();

  if (!res.ok) {
    console.error("ERRO ATIVOPAY STATUS:", res.status);
    console.error("ERRO ATIVOPAY BODY:", text);
    throw new Error(`Erro AtivoPay: ${text}`);
  }

  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Resposta da AtivoPay não é um JSON válido");
  }

  const tx = data?.data ?? data;

  const pix = tx?.pix ?? null;

  // 🧠 Mapeia TODAS as possibilidades de onde pode vir o copia-e-cola
  const pixCopiaECola: string | null =
    pix?.payload?.emv ||           // alguns gateways usam isso
    tx?.payload?.emv ||            // ou direto na raiz
    pix?.qrcode ||                 // NO TEU CASO, É ESSE AQUI ✅
    tx?.qrCode ||                  // fallback (campo na raiz)
    null;

  // Se em algum momento eles mandarem imagem em base64
  const qrCodeBase64: string | null =
    pix?.imageBase64 || tx?.qrCodeBase64 || null;

  return {
    raw: data,
    transactionId: tx?.id,
    amount: tx?.amount,
    status: tx?.status,
    pix,
    boleto: tx?.boleto || null,
    customer: tx?.customer || null,
    // 🔥 estes dois campos são o que a rota /api/pagamento/pix espera
    pixCopiaECola,
    qrCodeBase64,
  };
}
