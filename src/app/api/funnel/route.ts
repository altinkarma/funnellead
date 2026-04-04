import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const screens = await prisma.funnelScreen.findMany({
    include: { options: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(screens);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updateData: Record<string, unknown> = {};
  const fields = ["title", "subtitle", "hint", "stepLabel", "selectMode", "buttonText", "isActive", "sortOrder", "extraContent"];
  for (const f of fields) {
    if (data[f] !== undefined) updateData[f] = data[f];
  }

  const screen = await prisma.funnelScreen.update({
    where: { id },
    data: updateData,
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json(screen);
}
