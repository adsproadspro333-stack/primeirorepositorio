// app/api/minhas-compras/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const cpfRaw = String(body?.cpf || "").trim()

    const cpf = cpfRaw.replace(/\D/g, "")

    console.log("🔎 BUSCA MINHAS COMPRAS CPF:", cpf)

    if (!cpf || cpf.length < 11) {
      return NextResponse.json(
        { ok: false, error: "CPF inválido" },
        { status: 400 },
      )
    }

    // 1) Busca usuário pelo CPF
    const user = await prisma.user.findUnique({
      where: { cpf },
    })

    if (!user) {
      console.log("Nenhum usuário encontrado para CPF:", cpf)
      return NextResponse.json({ ok: true, orders: [] })
    }

    // 2) Busca pedidos desse usuário
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        transactions: true,
        tickets: true,
      },
    })

    console.log("Pedidos encontrados:", orders.length)

    const result = orders.map((o) => {
      const qFromOrder = o.quantity ?? 0
      const qFromTickets = o.tickets?.length ?? 0
      const quantity = qFromOrder || qFromTickets || 0

      // ID visível para o cliente
      const rawId = (o.id ?? "").replace(/-/g, "")
      const displayOrderCode = "#" + rawId.slice(-6).toUpperCase()

      return {
        id: o.id,
        displayOrderCode,
        amount: o.amount,
        status: o.status,
        createdAt: o.createdAt ? o.createdAt.toISOString() : null,
        quantity,
        numbers: o.tickets?.map((t) => t.number) ?? [],
        transactions:
          o.transactions?.map((t) => ({
            id: t.id,
            status: t.status,
            value: t.value,
            gatewayId: t.gatewayId,
          })) ?? [],
      }
    })

    return NextResponse.json({ ok: true, orders: result })
  } catch (err: any) {
    console.error("ERRO /api/minhas-compras:", err)
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Erro inesperado ao buscar pedidos",
      },
      { status: 500 },
    )
  }
}
