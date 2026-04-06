import { prisma } from "@/lib/prisma";
import { formatCurrency, STATUS_LABELS, STATUS_COLORS, formatDateTime } from "@/lib/utils";
import Link from "next/link";
import DailyChart from "@/components/daily-chart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [totalLeads, leads, recentLeads] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.findMany(),
    prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  const converted = leads.filter((l) => l.status === "converted").length;
  const convRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : "0";
  const avgSavings =
    leads.length > 0
      ? Math.round(leads.reduce((s, l) => s + (l.estimatedSavings || 0), 0) / leads.length)
      : 0;
  const activeLead = leads.filter((l) => l.status === "new" || l.status === "contacted").length;

  // Daily data for chart
  const dailyMap: Record<string, number> = {};
  for (const lead of leads) {
    const day = new Date(lead.createdAt).toISOString().slice(0, 10);
    dailyMap[day] = (dailyMap[day] || 0) + 1;
  }
  const dailyLeads = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, count]) => ({ date: date.slice(5), count }));

  const kpis = [
    { label: "Toplam Lead", value: totalLeads.toString(), icon: "👥", color: "bg-blue-50 border-blue-200" },
    { label: "Dönüşüm Oranı", value: `%${convRate}`, icon: "🎯", color: "bg-green-50 border-green-200" },
    { label: "Ort. Tasarruf", value: formatCurrency(avgSavings), icon: "💰", color: "bg-amber-50 border-amber-200" },
    { label: "Aktif Lead", value: activeLead.toString(), icon: "🔥", color: "bg-purple-50 border-purple-200" },
  ];

  const famLabels: Record<string, string> = { tek: "Bireysel", cift: "Çift", aile3: "3 Kişi", aile4: "4+ Kişi" };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">TSS Funnel genel bakış · 30+&apos;dan fazla sigorta firmasından teklif veriyoruz</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-xl border p-5 ${kpi.color} transition-transform hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{kpi.icon}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
            <div className="text-xs text-gray-500 mt-1 font-medium">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Son 14 Gün Lead Trendi</h2>
        <DailyChart data={dailyLeads} />
      </div>

      {/* Recent Leads Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Son Lead&apos;ler</h2>
          <Link href="/leads" className="text-xs text-blue-600 hover:underline font-medium">
            Tümünü Gör →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs">Telefon</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs">Tarih</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs">Yaş</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs">Aile</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs">Tasarruf</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs">Durum</th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-mono text-xs">{lead.phone || "—"}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{formatDateTime(lead.createdAt)}</td>
                  <td className="px-5 py-3 text-xs">{lead.ageGroup || "—"}</td>
                  <td className="px-5 py-3 text-xs">{famLabels[lead.familyType || ""] || lead.familyType || "—"}</td>
                  <td className="px-5 py-3 font-semibold text-xs">
                    {lead.estimatedSavings ? formatCurrency(lead.estimatedSavings) : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        STATUS_COLORS[lead.status] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {STATUS_LABELS[lead.status] || lead.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
