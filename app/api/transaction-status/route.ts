import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "transaction id obrigatório" },
        { status: 400 },
      )
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { order: true },
    })

    if (!transaction) {
      return NextResponse.json(
        { ok: false, error: "Transação não encontrada" },
        { status: 404 },
      )
    }

    return NextResponse.json({
      ok: true,
      status: transaction.status,
      orderId: transaction.orderId,
      orderStatus: transaction.order?.status ?? null,
    })
  } catch (err: any) {
    console.error("ERRO /api/transaction-status:", err)
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro inesperado" },
      { status: 500 },
    )
  }
}
