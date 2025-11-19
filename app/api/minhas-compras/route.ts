import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const cpfRaw = body?.cpf as string | undefined

    if (!cpfRaw) {
      return NextResponse.json(
        { ok: false, error: "CPF obrigatório" },
        { status: 400 }
      )
    }

    const cpf = cpfRaw.replace(/\D/g, "")

    const user = await prisma.user.findUnique({
      where: { cpf },
    })

    // Nenhum usuário → nenhuma compra
    if (!user) {
      return NextResponse.json({ ok: true, orders: [] })
    }

    // 🔥 PUXA SOMENTE PEDIDOS PAGOS (order.status = "paid")
    const orders = await prisma.order.findMany({
      where: {
        userId: user.id,
        status: "paid", // << ESSA LINHA FAZ TUDO FUNCIONAR
      },
      orderBy: { createdAt: "desc" },
      include: {
        tickets: true,
        transactions: {
          where: { status: "paid" }, // garante transação paga também
        },
      },
    })

    const result = orders.map((o) => ({
      id: o.id,
      amount: o.amount,
      status: o.status,
      createdAt: (o as any).createdAt ?? null,
      numbers: o.tickets?.map((t) => t.number) ?? [],
      transactions: o.transactions?.map((t) => ({
        id: t.id,
        status: t.status,
        value: t.value,
        gatewayId: t.gatewayId,
      })),
    }))

    return NextResponse.json({ ok: true, orders: result })
  } catch (err: any) {
    console.error("ERRO /api/minhas-compras:", err)
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro inesperado" },
      { status: 500 }
    )
  }
}
