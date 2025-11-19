import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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
      orderBy: { createdAt: "desc" }, // se existir createdAt
      include: {
        transactions: true,
        tickets: true,
      },
    })

    const result = orders.map((o) => ({
      id: o.id,
      amount: o.amount,
      status: o.status,
      // se não tiver createdAt no modelo, remove essa linha:
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
      { status: 500 },
    )
  }
}
