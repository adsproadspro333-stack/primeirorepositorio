// app/api/minhas-compras/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)

    if (!body) {
      return NextResponse.json(
        { ok: false, error: "Corpo da requisição inválido" },
        { status: 400 },
      )
    }

    const cpfRaw = body?.cpf as string | undefined

    if (!cpfRaw) {
      return NextResponse.json(
        { ok: false, error: "CPF obrigatório" },
        { status: 400 },
      )
    }

    const cpf = cpfRaw.replace(/\D/g, "")

    // 🔎 LOG pra debug em produção
    console.log("[/api/minhas-compras] CPF recebido:", cpf)

    // Em vez de buscar o user e depois o order por userId,
    // usamos o relacionamento direto: order.user.cpf
    const orders = await prisma.order.findMany({
      where: {
        user: {
          cpf, // <- relacionamento via CPF
        },
      },
      orderBy: { createdAt: "desc" }, // se não tiver createdAt no schema, pode remover
      include: {
        tickets: true,
        transactions: true,
        user: true,
      },
    })

    console.log("[/api/minhas-compras] Quantidade de pedidos encontrados:", orders.length)

    const result = orders.map((o) => ({
      id: o.id,
      amount: o.amount,
      status: o.status,
      createdAt: (o as any).createdAt ?? null,
      cpf: (o as any).user?.cpf ?? null,
      numbers: o.tickets?.map((t) => t.number) ?? [],
      transactions:
        o.transactions?.map((t) => ({
          id: t.id,
          status: t.status,
          value: t.value,
          gatewayId: t.gatewayId,
        })) ?? [],
    }))

    return NextResponse.json({ ok: true, orders: result }, { status: 200 })
  } catch (err: any) {
    console.error("ERRO /api/minhas-compras:", err)
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro inesperado" },
      { status: 500 },
    )
  }
}
