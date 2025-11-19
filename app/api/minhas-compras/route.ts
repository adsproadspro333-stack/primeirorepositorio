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
      const tickets = o.tickets ?? []
      const hasTickets = tickets.length > 0

      // 1️⃣ Prioridade:
      //    a) length dos tickets (se geramos bilhetes)
      //    b) campo quantity salvo no pedido
      //    c) fallback antigo baseado em valor (pros pedidos velhos)
      const numbersCount =
        (hasTickets ? tickets.length : undefined) ??
        o.quantity ??
        Math.round((o.amount * 100) / UNIT_PRICE_CENTS)

      return {
        id: o.id,
        amount: o.amount,
        status: o.status,
        createdAt: (o as any).createdAt ?? null,
        numbersCount,
        numbers: tickets.map((t) => t.number),
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
