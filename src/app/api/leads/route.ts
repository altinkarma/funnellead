import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const ageGroup = url.searchParams.get("ageGroup");

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (ageGroup && ageGroup !== "all") where.ageGroup = ageGroup;

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(leads);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status, notes } = body;

  const data: Record<string, unknown> = {};
  if (status) data.status = status;
  if (notes !== undefined) data.notes = notes;

  const lead = await prisma.lead.update({ where: { id }, data });
  return NextResponse.json(lead);
}
