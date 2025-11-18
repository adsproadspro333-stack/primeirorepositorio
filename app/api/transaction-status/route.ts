import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ status: "unknown" }, { status: 400 })
  }

  const tx = await prisma.transaction.findUnique({
    where: { id },
  })

  return NextResponse.json(
    { status: tx?.status ?? "unknown" },
    { status: 200 },
  )
}
