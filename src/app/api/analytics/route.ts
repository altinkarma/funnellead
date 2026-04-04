import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const [totalLeads, events, leads] = await Promise.all([
    prisma.lead.count(),
    prisma.funnelEvent.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.lead.findMany(),
  ]);

  // Funnel step counts
  const stepCounts: Record<string, number> = {};
  const sessionSteps = new Map<string, Set<string>>();

  for (const e of events) {
    if (!sessionSteps.has(e.sessionId)) sessionSteps.set(e.sessionId, new Set());
    sessionSteps.get(e.sessionId)!.add(e.step);
  }

  for (const [, steps] of sessionSteps) {
    for (const step of steps) {
      stepCounts[step] = (stepCounts[step] || 0) + 1;
    }
  }

  // Demographics
  const ageDist: Record<string, number> = {};
  const famDist: Record<string, number> = {};
  const insDist: Record<string, number> = {};
  const statusDist: Record<string, number> = {};
  const riskDist: Record<string, number> = {};

  for (const lead of leads) {
    if (lead.ageGroup) ageDist[lead.ageGroup] = (ageDist[lead.ageGroup] || 0) + 1;
    if (lead.familyType) famDist[lead.familyType] = (famDist[lead.familyType] || 0) + 1;
    if (lead.insurance) insDist[lead.insurance] = (insDist[lead.insurance] || 0) + 1;
    statusDist[lead.status] = (statusDist[lead.status] || 0) + 1;
    if (lead.risks) {
      try {
        const risks = JSON.parse(lead.risks) as string[];
        for (const r of risks) riskDist[r] = (riskDist[r] || 0) + 1;
      } catch {}
    }
  }

  // Daily leads (last 30 days)
  const dailyMap: Record<string, number> = {};
  for (const lead of leads) {
    const day = new Date(lead.createdAt).toISOString().slice(0, 10);
    dailyMap[day] = (dailyMap[day] || 0) + 1;
  }
  const dailyLeads = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const converted = leads.filter((l) => l.status === "converted").length;
  const avgSavings = leads.length > 0
    ? Math.round(leads.reduce((s, l) => s + (l.estimatedSavings || 0), 0) / leads.length)
    : 0;

  return NextResponse.json({
    totalLeads,
    converted,
    conversionRate: totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : "0",
    avgSavings,
    stepCounts,
    ageDist,
    famDist,
    insDist,
    statusDist,
    riskDist,
    dailyLeads,
  });
}
