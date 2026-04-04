"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface Firm {
  id: string;
  name: string;
  package: string;
  isActive: boolean;
  premiums: string;
}

interface Settings {
  familyDiscount: number;
  newBizDiscount: number;
}

const AGE_KEYS = ["0-1", "11-18", "25", "35", "45", "55", "65"];
const AGE_LABELS: Record<string, string> = {
  "0-1": "0-1 yaş",
  "11-18": "11-18",
  "25": "18-30",
  "35": "31-45",
  "45": "46-60",
  "55": "55-65",
  "65": "60+",
};

export default function FirmsPage() {
  const [firms, setFirms] = useState<Firm[]>([]);
  const [settings, setSettings] = useState<Settings>({ familyDiscount: 0.1, newBizDiscount: 0.05 });
  const [editingFirm, setEditingFirm] = useState<string | null>(null);
  const [editPremiums, setEditPremiums] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/firms")
      .then((r) => r.json())
      .then((data) => {
        setFirms(data.firms);
        if (data.settings) setSettings(data.settings);
      });
  }, []);

  async function toggleActive(firm: Firm) {
    await fetch("/api/firms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firmId: firm.id, isActive: !firm.isActive }),
    });
    setFirms((prev) =>
      prev.map((f) => (f.id === firm.id ? { ...f, isActive: !f.isActive } : f))
    );
  }

  function startEdit(firm: Firm) {
    setEditingFirm(firm.id);
    setEditPremiums(JSON.parse(firm.premiums));
  }

  async function savePremiums(firmId: string) {
    setSaving(true);
    await fetch("/api/firms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firmId, premiums: editPremiums }),
    });
    setFirms((prev) =>
      prev.map((f) => (f.id === firmId ? { ...f, premiums: JSON.stringify(editPremiums) } : f))
    );
    setEditingFirm(null);
    setSaving(false);
  }

  async function saveSettings() {
    setSaving(true);
    await fetch("/api/firms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    });
    setSaving(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Firma & Fiyat Yönetimi</h1>
        <p className="text-sm text-gray-500 mt-1">
          {firms.length} firma kayıtlı, {firms.filter((f) => f.isActive).length} aktif
        </p>
      </div>

      {/* Discount Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">İndirim Oranları</h2>
        <div className="flex gap-6 items-end flex-wrap">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Aile İndirimi (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={settings.familyDiscount}
              onChange={(e) => setSettings({ ...settings, familyDiscount: parseFloat(e.target.value) || 0 })}
              className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Yeni İş İndirimi (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={settings.newBizDiscount}
              onChange={(e) => setSettings({ ...settings, newBizDiscount: parseFloat(e.target.value) || 0 })}
              className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Bileşik İndirim</label>
            <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-bold text-green-700">
              %{((1 - (1 - settings.familyDiscount) * (1 - settings.newBizDiscount)) * 100).toFixed(1)}
            </div>
          </div>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-4 py-2 bg-[#0D297B] text-white text-sm font-semibold rounded-lg hover:bg-[#201652] disabled:opacity-50"
          >
            Kaydet
          </button>
        </div>
      </div>

      {/* Firm Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {firms.map((firm) => {
          const premiums = JSON.parse(firm.premiums) as Record<string, number>;
          const isEditing = editingFirm === firm.id;

          return (
            <div
              key={firm.id}
              className={`bg-white rounded-xl border p-5 transition-all ${
                firm.isActive ? "border-gray-200" : "border-gray-100 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{firm.name}</h3>
                  <span className="text-xs text-gray-500">{firm.package}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(firm)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                      firm.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {firm.isActive ? "Aktif" : "Pasif"}
                  </button>
                  {!isEditing && (
                    <button
                      onClick={() => startEdit(firm)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-gray-200 hover:bg-gray-50"
                    >
                      Düzenle
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mt-3">
                {AGE_KEYS.map((key) => (
                  <div key={key} className="text-center">
                    <div className="text-[10px] text-gray-400 font-medium mb-1">{AGE_LABELS[key]}</div>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editPremiums[key] || 0}
                        onChange={(e) =>
                          setEditPremiums({ ...editPremiums, [key]: parseInt(e.target.value) || 0 })
                        }
                        className="w-full text-center text-xs border border-blue-300 rounded px-1 py-1 bg-blue-50"
                      />
                    ) : (
                      <div className="text-xs font-semibold text-gray-700">
                        {formatCurrency(premiums[key] || 0)}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {isEditing && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => savePremiums(firm.id)}
                    disabled={saving}
                    className="flex-1 px-3 py-2 bg-[#0D297B] text-white text-xs font-semibold rounded-lg hover:bg-[#201652] disabled:opacity-50"
                  >
                    Kaydet
                  </button>
                  <button
                    onClick={() => setEditingFirm(null)}
                    className="px-3 py-2 border border-gray-200 text-xs font-semibold rounded-lg hover:bg-gray-50"
                  >
                    İptal
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
