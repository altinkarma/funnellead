"use client";

import { useEffect, useState, useCallback } from "react";
import { formatCurrency, formatDateTime, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";

interface Lead {
  id: string;
  sessionId: string;
  phone: string | null;
  createdAt: string;
  ageGroup: string | null;
  familyType: string | null;
  lifestyle: string | null;
  insurance: string | null;
  risks: string | null;
  chronicCondition: string | null;
  estimatedSavings: number | null;
  status: string;
  notes: string | null;
}

const FAM_LABELS: Record<string, string> = { tek: "Bireysel", cift: "Çift", aile3: "3 Kişi", aile4: "4+ Kişi" };
const INS_LABELS: Record<string, string> = { yok: "Yok", sgk: "SGK", ozel: "Özel", ise: "İşveren" };

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (ageFilter !== "all") params.set("ageGroup", ageFilter);
    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    setLeads(data);
    setLoading(false);
  }, [statusFilter, ageFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  async function updateStatus(id: string, status: string) {
    await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchLeads();
    if (selected?.id === id) setSelected({ ...selected, status });
  }

  function exportCSV() {
    const header = "Telefon,Tarih,Yaş,Aile,Sigorta,Tasarruf,Durum\n";
    const rows = leads.map((l) =>
      [
        l.phone || "",
        new Date(l.createdAt).toISOString().slice(0, 10),
        l.ageGroup || "",
        FAM_LABELS[l.familyType || ""] || "",
        INS_LABELS[l.insurance || ""] || "",
        l.estimatedSavings || "",
        STATUS_LABELS[l.status] || l.status,
      ].join(",")
    );
    const blob = new Blob([header + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-1">{leads.length} lead listeleniyor · 30+&apos;dan fazla sigorta firmasından teklif veriyoruz</p>
        </div>
        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-[#0D297B] text-white text-sm font-semibold rounded-lg hover:bg-[#201652] transition-colors"
        >
          CSV İndir
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="new">Yeni</option>
          <option value="contacted">İletişime Geçildi</option>
          <option value="converted">Dönüştürüldü</option>
          <option value="lost">Kayıp</option>
        </select>
        <select
          value={ageFilter}
          onChange={(e) => setAgeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="all">Tüm Yaşlar</option>
          <option value="18-30">18-30</option>
          <option value="31-45">31-45</option>
          <option value="46-60">46-60</option>
          <option value="60+">60+</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Yükleniyor...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs">Telefon</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs">Tarih</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs">Yaş</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs">Aile</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs">Sigorta</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs">Tasarruf</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs">Durum</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer"
                    onClick={() => setSelected(lead)}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{lead.phone || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(lead.createdAt)}</td>
                    <td className="px-4 py-3 text-xs">{lead.ageGroup || "—"}</td>
                    <td className="px-4 py-3 text-xs">{FAM_LABELS[lead.familyType || ""] || "—"}</td>
                    <td className="px-4 py-3 text-xs">{INS_LABELS[lead.insurance || ""] || "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-xs">
                      {lead.estimatedSavings ? formatCurrency(lead.estimatedSavings) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          STATUS_COLORS[lead.status] || "bg-gray-100"
                        }`}
                      >
                        {STATUS_LABELS[lead.status] || lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.status}
                        onChange={(e) => updateStatus(lead.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                      >
                        <option value="new">Yeni</option>
                        <option value="contacted">İletişime Geçildi</option>
                        <option value="converted">Dönüştürüldü</option>
                        <option value="lost">Kayıp</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div
            className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Lead Detayı</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="space-y-3 text-sm">
              <Row label="Session ID" value={selected.sessionId} />
              <Row label="Telefon" value={selected.phone || "—"} />
              <Row label="Tarih" value={formatDateTime(selected.createdAt)} />
              <Row label="Yaş Grubu" value={selected.ageGroup || "—"} />
              <Row label="Aile Tipi" value={FAM_LABELS[selected.familyType || ""] || "—"} />
              <Row label="Mevcut Sigorta" value={INS_LABELS[selected.insurance || ""] || "—"} />
              <Row label="Kronik" value={selected.chronicCondition || "—"} />
              <Row label="Yaşam Tarzı" value={parseJSON(selected.lifestyle)} />
              <Row label="Riskler" value={parseJSON(selected.risks)} />
              <Row
                label="Tahmini Tasarruf"
                value={selected.estimatedSavings ? formatCurrency(selected.estimatedSavings) : "—"}
              />
              <Row label="Durum" value={STATUS_LABELS[selected.status] || selected.status} />
              <Row label="Notlar" value={selected.notes || "—"} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex border-b border-gray-100 pb-2">
      <span className="w-36 shrink-0 font-medium text-gray-500">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

function parseJSON(val: string | null): string {
  if (!val) return "—";
  try {
    const arr = JSON.parse(val);
    return Array.isArray(arr) ? arr.join(", ") : val;
  } catch {
    return val;
  }
}
