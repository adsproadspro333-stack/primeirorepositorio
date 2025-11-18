import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Webhook da AtivoPay
 * URL (depois de publicar): https://SEU-DOMINIO.com/api/webhooks/ativopay
 *
 * IMPORTANTE:
 * - Ajustar os nomes dos campos do body de acordo com o payload REAL da AtivoPay.
 * - Aqui eu considerei campos genéricos: transactionId, status, amount, metadata.orderId
 */

function normalizarStatus(statusRaw: string | undefined): "paid" | "pending" | "canceled" {
  const s = (statusRaw || "").toUpperCase();

  // Ajuste esses valores de acordo com a documentação da AtivoPay
  if (["PAID", "APPROVED", "CONFIRMED", "SUCCEEDED"].includes(s)) return "paid";
  if (["CANCELED", "CANCELLED", "REFUNDED", "CHARGEBACK"].includes(s)) return "canceled";

  // WAITING_PAYMENT, PENDING, etc...
  return "pending";
}

export async function POST(req: Request) {
  try {
    // Se quiser proteger com uma chave secreta, pode ler um header aqui:
    // const secret = req.headers.get("x-ativopay-secret");
    // if (secret !== process.env.ATIVOPAY_WEBHOOK_SECRET) { ... }

    const body = await req.json();
    console.log("[WEBHOOK ATIVOPAY] payload recebido:", body);

    // ❗ Ajuste esses campos de acordo com o que a AtivoPay realmente envia
    const gatewayTransactionId: string | undefined = body.transactionId || body.id || body.transaction_id;
    const rawStatus: string | undefined = body.status || body.currentStatus;
    const amountInCents: number | undefined =
      typeof body.amount === "number"
        ? body.amount
        : typeof body.amountInCents === "number"
        ? body.amountInCents
        : undefined;

    if (!gatewayTransactionId) {
      console.error("[WEBHOOK ATIVOPAY] sem transactionId no payload");
      return NextResponse.json({ ok: false, error: "missing transactionId" }, { status: 400 });
    }

    const status = normalizarStatus(rawStatus);

    // 1️⃣ Encontrar a transação pelo gatewayId que salvamos quando criamos o PIX
    const transaction = await prisma.transaction.findFirst({
      where: { gatewayId: gatewayTransactionId },
      include: { order: true },
    });

    if (!transaction) {
      console.warn("[WEBHOOK ATIVOPAY] transação não encontrada para gatewayId:", gatewayTransactionId);
      // Mesmo assim respondemos 200 pra AtivoPay não ficar re-tentando eternamente
      return NextResponse.json({ ok: true, ignored: true });
    }

    // 2️⃣ Atualizar transação
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status, // "paid" | "pending" | "canceled"
        // se quiser, pode salvar o valor vindo do webhook:
        ...(typeof amountInCents === "number"
          ? { value: amountInCents / 100 }
          : {}),
      },
    });

    // 3️⃣ Se ficar "paid", atualiza também o pedido ligado à transação
    if (status === "paid") {
      await prisma.order.update({
        where: { id: transaction.orderId },
        data: {
          status: "paid",
          // garante o valor em reais (caso queira sincronizar)
          ...(typeof amountInCents === "number"
            ? { amount: amountInCents / 100 }
            : {}),
        },
      });
    }

    console.log("[WEBHOOK ATIVOPAY] transação atualizada:", {
      transactionId: updatedTransaction.id,
      orderId: transaction.orderId,
      status,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[WEBHOOK ATIVOPAY] erro ao processar:", err);
    // Sempre devolve 200 ou 2xx? Depende de como você quer lidar com retries.
    // Aqui mando 200 com erro no body pra você ver nos logs.
    return NextResponse.json(
      { ok: false, error: err?.message || "erro inesperado" },
      { status: 200 },
    );
  }
}
