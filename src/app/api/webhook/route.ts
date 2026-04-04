import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, sessionId, data } = body;

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  if (type === "step") {
    await prisma.funnelEvent.create({
      data: {
        sessionId,
        step: data.step,
        action: data.action || null,
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (type === "lead") {
    await prisma.lead.upsert({
      where: { sessionId },
      create: {
        sessionId,
        phone: data.phone || null,
        ageGroup: data.ageGroup || null,
        familyType: data.familyType || null,
        lifestyle: data.lifestyle ? JSON.stringify(data.lifestyle) : null,
        insurance: data.insurance || null,
        risks: data.risks ? JSON.stringify(data.risks) : null,
        chronicCondition: data.chronicCondition || null,
        pregnancyStatus: data.pregnancyStatus || null,
        estimatedSavings: data.estimatedSavings || null,
      },
      update: {
        phone: data.phone || undefined,
        ageGroup: data.ageGroup || undefined,
        familyType: data.familyType || undefined,
        lifestyle: data.lifestyle ? JSON.stringify(data.lifestyle) : undefined,
        insurance: data.insurance || undefined,
        risks: data.risks ? JSON.stringify(data.risks) : undefined,
        chronicCondition: data.chronicCondition || undefined,
        pregnancyStatus: data.pregnancyStatus || undefined,
        estimatedSavings: data.estimatedSavings || undefined,
      },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

// Allow CORS from funnel page
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
