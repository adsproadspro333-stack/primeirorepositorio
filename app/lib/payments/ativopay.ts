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

  const url = `${BASE_URL}/api/user/transactions`; // igual ao curl da doc

  // Decide o postbackUrl efetivo (params > env)
  const candidatePostback =
    params.postbackUrl || WEBHOOK_URL || undefined;

  // Só aceita HTTPS (pra não tomar 403 "não pode http")
  const safePostbackUrl =
    candidatePostback && candidatePostback.startsWith("https://")
      ? candidatePostback
      : undefined;

  const body: any = {
    pix: {
      expiresInDays: params.expiresInDays,
    },
    items: params.items,
    amount: params.amount, // valor em centavos
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
  console.log(
    "PAYLOAD PARA ATIVOPAY:",
    JSON.stringify(body, null, 2)
  );

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

  return {
    raw: data,
    transactionId: tx?.id,
    amount: tx?.amount,
    status: tx?.status,
    pix: tx?.pix || null,
    boleto: tx?.boleto || null,
    customer: tx?.customer || null,
  };
}
