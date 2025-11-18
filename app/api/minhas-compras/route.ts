import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cpf = searchParams.get("cpf");

    if (!cpf) {
      return NextResponse.json(
        { error: "cpf é obrigatório" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { cpf },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          include: {
            tickets: true,
            transactions: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(user.orders, { status: 200 });
  } catch (error) {
    console.error("ERRO AO BUSCAR COMPRAS:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar compras" },
      { status: 500 }
    );
  }
}
