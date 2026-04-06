import { prisma } from "@/lib/prisma";
import { FUNNEL_STEPS, STEP_LABELS } from "@/lib/utils";
import FunnelViz from "@/components/funnel-viz";
import DistChart from "@/components/dist-chart";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [events, leads] = await Promise.all([
    prisma.funnelEvent.findMany(),
    prisma.lead.findMany(),
  ]);

  // Build funnel step counts
  const sessionSteps = new Map<string, Set<string>>();
  for (const e of events) {
    if (!sessionSteps.has(e.sessionId)) sessionSteps.set(e.sessionId, new Set());
    sessionSteps.get(e.sessionId)!.add(e.step);
  }

  const stepCounts = FUNNEL_STEPS.map((step) => {
    let count = 0;
    for (const [, steps] of sessionSteps) {
      if (steps.has(step)) count++;
    }
    return { step, label: STEP_LABELS[step] || step, count };
  });

  // Demographics
  const ageDist: Record<string, number> = {};
  const famDist: Record<string, number> = {};
  const insDist: Record<string, number> = {};
  const riskDist: Record<string, number> = {};

  const famLabels: Record<string, string> = { tek: "Bireysel", cift: "Çift", aile3: "3 Kişi", aile4: "4+ Kişi" };
  const insLabels: Record<string, string> = { yok: "Yok", sgk: "Sadece SGK", ozel: "Özel Sigorta", ise: "İşveren" };
  const riskLabels: Record<string, string> = {
    ameliyat: "Ameliyat", kanser: "Kanser", kaza: "Kaza",
    kronik: "Kronik", cocuk: "Çocuk", sgk: "SGK Açıkları",
  };

  for (const lead of leads) {
    if (lead.ageGroup) ageDist[lead.ageGroup] = (ageDist[lead.ageGroup] || 0) + 1;
    if (lead.familyType) {
      const label = famLabels[lead.familyType] || lead.familyType;
      famDist[label] = (famDist[label] || 0) + 1;
    }
    if (lead.insurance) {
      const label = insLabels[lead.insurance] || lead.insurance;
      insDist[label] = (insDist[label] || 0) + 1;
    }
    if (lead.risks) {
      try {
        const risks = JSON.parse(lead.risks) as string[];
        for (const r of risks) {
          const label = riskLabels[r] || r;
          riskDist[label] = (riskDist[label] || 0) + 1;
        }
      } catch {}
    }
  }

  const toChartData = (dist: Record<string, number>) =>
    Object.entries(dist).map(([name, value]) => ({ name, value }));

  const maxCount = Math.max(...stepCounts.map((s) => s.count), 1);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Funnel Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Adım bazında dönüşüm ve drop-off analizi · 30+&apos;dan fazla sigorta firmasından teklif veriyoruz</p>
      </div>

      {/* Funnel Visualization */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-5">Funnel Adımları</h2>
        <FunnelViz steps={stepCounts} maxCount={maxCount} />
      </div>

      {/* Drop-off Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Adım Bazında Drop-off</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs">Adım</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs">Giriş</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs">Drop-off</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs">Drop %</th>
              </tr>
            </thead>
            <tbody>
              {stepCounts.map((s, i) => {
                const prev = i > 0 ? stepCounts[i - 1].count : s.count;
                const drop = prev - s.count;
                const dropPct = prev > 0 ? ((drop / prev) * 100).toFixed(1) : "0";
                return (
                  <tr key={s.step} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium">{s.label}</td>
                    <td className="px-5 py-3 text-right font-semibold">{s.count}</td>
                    <td className="px-5 py-3 text-right text-red-600">{i > 0 ? `-${drop}` : "—"}</td>
                    <td className="px-5 py-3 text-right">
                      {i > 0 ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          parseFloat(dropPct) > 30 ? "bg-red-100 text-red-700" :
                          parseFloat(dropPct) > 15 ? "bg-amber-100 text-amber-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          %{dropPct}
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Yaş Dağılımı</h3>
          <DistChart data={toChartData(ageDist)} color="#0D297B" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Aile Tipi Dağılımı</h3>
          <DistChart data={toChartData(famDist)} color="#01BB77" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Mevcut Sigorta</h3>
          <DistChart data={toChartData(insDist)} color="#F59E0B" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Risk Seçimleri</h3>
          <DistChart data={toChartData(riskDist)} color="#EF4444" />
        </div>
      </div>
    </div>
  );
}
