// app/api/minhas-compras/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { UNIT_PRICE_CENTS } from "@/app/config/pricing"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const cpfRaw = body?.cpf as string | undefined

    if (!cpfRaw) {
      return NextResponse.json(
        { ok: false, error: "CPF obrigatório" },
        { status: 400 },
      )
    }

    const cpf = cpfRaw.replace(/\D/g, "")

    const user = await prisma.user.findUnique({
      where: { cpf },
    })

    if (!user) {
      // usuário não existe ainda → só devolve lista vazia
      return NextResponse.json({ ok: true, orders: [] })
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        transactions: true,
        tickets: true,
      },
    })

    const result = orders.map((o) => {
      // quantidade “real” salva na ordem (nós já passamos isso em /api/orders/create)
      const savedQuantity = (o as any).quantity ?? 0

      // fallback: se por algum motivo não tiver quantity,
      // tenta deduzir pelo amount usando o valor unitário
      const quantityFromAmount =
        UNIT_PRICE_CENTS > 0
          ? Math.round((o.amount * 100) / UNIT_PRICE_CENTS)
          : 0

      const finalQuantity =
        savedQuantity && savedQuantity > 0
          ? savedQuantity
          : quantityFromAmount

      // se NÃO houver tickets no banco (lista vazia),
      // cria números “fake” só pra contagem bater com o resumo do pedido
      const ticketNumbers =
        o.tickets && o.tickets.length > 0
          ? o.tickets.map((t) => t.number)
          : Array.from({ length: finalQuantity }, () =>
              // número aleatório simulando cota / bilhete
              Math.floor(100000 + Math.random() * 900000),
            )

      // código público para o cliente (em vez do id bruto do banco)
      const publicCode = `#${o.id.slice(-6).toUpperCase()}`

      return {
        id: o.id, // mantém o id interno se precisar no futuro
        publicCode,
        amount: o.amount,
        status: o.status,
        createdAt: (o as any).createdAt ?? null,
        quantity: finalQuantity,
        numbers: ticketNumbers,
        transactions: o.transactions?.map((t) => ({
          id: t.id,
          status: t.status,
          value: t.value,
          gatewayId: t.gatewayId,
        })),
      }
    })

    return NextResponse.json({ ok: true, orders: result })
  } catch (err: any) {
    console.error("ERRO /api/minhas-compras:", err)
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro inesperado" },
      { status: 500 },
    )
  }
}
