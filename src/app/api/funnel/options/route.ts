import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updateData: Record<string, unknown> = {};
  const fields = ["icon", "label", "description", "value", "sortOrder", "isActive", "style", "condition"];
  for (const f of fields) {
    if (data[f] !== undefined) updateData[f] = data[f];
  }

  const option = await prisma.funnelOption.update({
    where: { id },
    data: updateData,
  });
  return NextResponse.json(option);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { screenId, icon, label, description, value, sortOrder } = body;

  if (!screenId || !label || !value) {
    return NextResponse.json({ error: "screenId, label, value required" }, { status: 400 });
  }

  const option = await prisma.funnelOption.create({
    data: {
      screenId,
      icon: icon || null,
      label,
      description: description || null,
      value,
      sortOrder: sortOrder || 0,
    },
  });
  return NextResponse.json(option);
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.funnelOption.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
