import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const firms = await prisma.firm.findMany({ orderBy: { name: "asc" } });
  const settings = await prisma.settings.findUnique({ where: { id: "global" } });
  return NextResponse.json({ firms, settings });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();

  if (body.firmId) {
    const { firmId, premiums, isActive } = body;
    const data: Record<string, unknown> = {};
    if (premiums !== undefined) data.premiums = typeof premiums === "string" ? premiums : JSON.stringify(premiums);
    if (isActive !== undefined) data.isActive = isActive;

    const firm = await prisma.firm.update({ where: { id: firmId }, data });
    return NextResponse.json(firm);
  }

  if (body.settings) {
    const { familyDiscount, newBizDiscount } = body.settings;
    const settings = await prisma.settings.update({
      where: { id: "global" },
      data: { familyDiscount, newBizDiscount },
    });
    return NextResponse.json(settings);
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
