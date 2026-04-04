"use client";

import { useEffect, useState, useCallback } from "react";

interface FunnelOption {
  id: string;
  screenId: string;
  icon: string | null;
  label: string;
  description: string | null;
  value: string;
  sortOrder: number;
  isActive: boolean;
  style: string | null;
  condition: string | null;
}

interface FunnelScreen {
  id: string;
  stepLabel: string | null;
  title: string;
  subtitle: string | null;
  hint: string | null;
  selectMode: string;
  buttonText: string | null;
  sortOrder: number;
  isActive: boolean;
  extraContent: string | null;
  options: FunnelOption[];
}

const SELECT_MODES = [
  { value: "single", label: "Tekli Seçim" },
  { value: "multi", label: "Çoklu Seçim" },
  { value: "none", label: "Seçim Yok" },
];

export default function FunnelEditorPage() {
  const [screens, setScreens] = useState<FunnelScreen[]>([]);
  const [activeScreen, setActiveScreen] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [addingOption, setAddingOption] = useState(false);
  const [newOpt, setNewOpt] = useState({ icon: "", label: "", description: "", value: "" });

  const fetchScreens = useCallback(async () => {
    const res = await fetch("/api/funnel");
    const data = await res.json();
    setScreens(data);
    if (!activeScreen && data.length > 0) setActiveScreen(data[0].id);
  }, [activeScreen]);

  useEffect(() => {
    fetchScreens();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const current = screens.find((s) => s.id === activeScreen);

  function updateScreenLocal(id: string, field: string, value: unknown) {
    setScreens((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  function updateOptionLocal(optId: string, field: string, value: unknown) {
    setScreens((prev) =>
      prev.map((s) => ({
        ...s,
        options: s.options.map((o) => (o.id === optId ? { ...o, [field]: value } : o)),
      }))
    );
  }

  async function saveScreen() {
    if (!current) return;
    setSaving(true);
    setSaveMsg("");
    try {
      await fetch("/api/funnel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: current.id,
          title: current.title,
          subtitle: current.subtitle,
          hint: current.hint,
          stepLabel: current.stepLabel,
          selectMode: current.selectMode,
          buttonText: current.buttonText,
          isActive: current.isActive,
          extraContent: current.extraContent,
        }),
      });

      for (const opt of current.options) {
        await fetch("/api/funnel/options", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: opt.id,
            icon: opt.icon,
            label: opt.label,
            description: opt.description,
            value: opt.value,
            sortOrder: opt.sortOrder,
            isActive: opt.isActive,
            style: opt.style,
            condition: opt.condition,
          }),
        });
      }

      setSaveMsg("Kaydedildi!");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch {
      setSaveMsg("Hata oluştu");
    }
    setSaving(false);
  }

  async function addOption() {
    if (!current || !newOpt.label || !newOpt.value) return;
    const res = await fetch("/api/funnel/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        screenId: current.id,
        icon: newOpt.icon || null,
        label: newOpt.label,
        description: newOpt.description || null,
        value: newOpt.value,
        sortOrder: current.options.length,
      }),
    });
    const opt = await res.json();
    setScreens((prev) =>
      prev.map((s) =>
        s.id === current.id ? { ...s, options: [...s.options, opt] } : s
      )
    );
    setNewOpt({ icon: "", label: "", description: "", value: "" });
    setAddingOption(false);
  }

  async function deleteOption(optId: string) {
    await fetch(`/api/funnel/options?id=${optId}`, { method: "DELETE" });
    setScreens((prev) =>
      prev.map((s) => ({
        ...s,
        options: s.options.filter((o) => o.id !== optId),
      }))
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Funnel Editör</h1>
          <p className="text-sm text-gray-500 mt-1">Tüm ekranları, soruları ve seçenekleri düzenleyin</p>
        </div>
        {saveMsg && (
          <span className={`text-sm font-semibold ${saveMsg === "Kaydedildi!" ? "text-green-600" : "text-red-600"}`}>
            {saveMsg}
          </span>
        )}
      </div>

      <div className="flex gap-6">
        {/* Screen List - Left Panel */}
        <div className="w-64 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-6">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ekranlar</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {screens.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveScreen(s.id)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                    activeScreen === s.id
                      ? "bg-blue-50 text-blue-900 border-l-3 border-l-[#0D297B]"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="font-semibold text-xs">{s.id}</div>
                  <div className="text-[11px] text-gray-500 truncate mt-0.5">{s.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${s.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                    <span className="text-[10px] text-gray-400">
                      {s.options.length > 0 ? `${s.options.length} seçenek` : s.selectMode === "none" ? "Bilgi ekranı" : "—"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Editor - Right Panel */}
        <div className="flex-1 min-w-0">
          {current ? (
            <div className="space-y-5">
              {/* Screen Header */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-[#0D297B] text-white text-xs font-bold rounded-lg">
                      {current.id}
                    </span>
                    <span className="text-xs text-gray-400">{current.selectMode === "single" ? "Tekli Seçim" : current.selectMode === "multi" ? "Çoklu Seçim" : "Bilgi Ekranı"}</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={current.isActive}
                      onChange={(e) => updateScreenLocal(current.id, "isActive", e.target.checked)}
                      className="w-4 h-4 rounded accent-[#0D297B]"
                    />
                    <span className="text-xs font-medium text-gray-600">Aktif</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Başlık</Label>
                    <input
                      type="text"
                      value={current.title}
                      onChange={(e) => updateScreenLocal(current.id, "title", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#0D297B] focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Alt Başlık</Label>
                    <textarea
                      value={current.subtitle || ""}
                      onChange={(e) => updateScreenLocal(current.id, "subtitle", e.target.value || null)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#0D297B] focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <Label>Adım Etiketi</Label>
                    <input
                      type="text"
                      value={current.stepLabel || ""}
                      onChange={(e) => updateScreenLocal(current.id, "stepLabel", e.target.value || null)}
                      placeholder="Soru 1 / 7"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#0D297B] focus:outline-none"
                    />
                  </div>
                  <div>
                    <Label>Seçim Modu</Label>
                    <select
                      value={current.selectMode}
                      onChange={(e) => updateScreenLocal(current.id, "selectMode", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                    >
                      {SELECT_MODES.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Buton Metni</Label>
                    <input
                      type="text"
                      value={current.buttonText || ""}
                      onChange={(e) => updateScreenLocal(current.id, "buttonText", e.target.value || null)}
                      placeholder="Devam Et →"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#0D297B] focus:outline-none"
                    />
                  </div>
                  <div>
                    <Label>Sıra</Label>
                    <input
                      type="number"
                      value={current.sortOrder}
                      onChange={(e) => updateScreenLocal(current.id, "sortOrder", parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#0D297B] focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>İpucu (Hint)</Label>
                    <textarea
                      value={current.hint || ""}
                      onChange={(e) => updateScreenLocal(current.id, "hint", e.target.value || null)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#0D297B] focus:outline-none resize-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Ek İçerik (JSON)</Label>
                    <textarea
                      value={current.extraContent || ""}
                      onChange={(e) => updateScreenLocal(current.id, "extraContent", e.target.value || null)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono focus:border-[#0D297B] focus:outline-none resize-y"
                    />
                  </div>
                </div>
              </div>

              {/* Options */}
              {current.selectMode !== "none" && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-700">
                      Seçenekler ({current.options.length})
                    </h3>
                    <button
                      onClick={() => setAddingOption(true)}
                      className="px-3 py-1.5 text-xs font-semibold text-[#0D297B] border border-[#0D297B]/20 rounded-lg hover:bg-blue-50"
                    >
                      + Yeni Seçenek
                    </button>
                  </div>

                  <div className="space-y-3">
                    {current.options.map((opt, idx) => (
                      <div
                        key={opt.id}
                        className={`border rounded-lg p-4 transition-colors ${
                          opt.isActive ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50 opacity-60"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-xl mt-1">{opt.icon || "⬜"}</div>
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <div>
                              <LabelSm>İkon</LabelSm>
                              <input
                                type="text"
                                value={opt.icon || ""}
                                onChange={(e) => updateOptionLocal(opt.id, "icon", e.target.value || null)}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                                placeholder="🔪"
                              />
                            </div>
                            <div>
                              <LabelSm>Değer (value)</LabelSm>
                              <input
                                type="text"
                                value={opt.value}
                                onChange={(e) => updateOptionLocal(opt.id, "value", e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm font-mono"
                              />
                            </div>
                            <div className="col-span-2">
                              <LabelSm>Başlık</LabelSm>
                              <input
                                type="text"
                                value={opt.label}
                                onChange={(e) => updateOptionLocal(opt.id, "label", e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                              />
                            </div>
                            <div className="col-span-2">
                              <LabelSm>Açıklama</LabelSm>
                              <input
                                type="text"
                                value={opt.description || ""}
                                onChange={(e) => updateOptionLocal(opt.id, "description", e.target.value || null)}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col items-center gap-2 shrink-0">
                            <span className="text-[10px] text-gray-400 font-mono">#{idx}</span>
                            <label className="cursor-pointer" title={opt.isActive ? "Aktif" : "Pasif"}>
                              <input
                                type="checkbox"
                                checked={opt.isActive}
                                onChange={(e) => updateOptionLocal(opt.id, "isActive", e.target.checked)}
                                className="w-3.5 h-3.5 accent-green-600"
                              />
                            </label>
                            <button
                              onClick={() => deleteOption(opt.id)}
                              className="text-red-400 hover:text-red-600 text-xs"
                              title="Sil"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add New Option Form */}
                    {addingOption && (
                      <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50/30">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <LabelSm>İkon</LabelSm>
                            <input
                              type="text"
                              value={newOpt.icon}
                              onChange={(e) => setNewOpt({ ...newOpt, icon: e.target.value })}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                              placeholder="🔪"
                            />
                          </div>
                          <div>
                            <LabelSm>Değer (value)*</LabelSm>
                            <input
                              type="text"
                              value={newOpt.value}
                              onChange={(e) => setNewOpt({ ...newOpt, value: e.target.value })}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm font-mono"
                              placeholder="ameliyat"
                            />
                          </div>
                          <div className="col-span-2">
                            <LabelSm>Başlık*</LabelSm>
                            <input
                              type="text"
                              value={newOpt.label}
                              onChange={(e) => setNewOpt({ ...newOpt, label: e.target.value })}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                              placeholder="Seçenek başlığı"
                            />
                          </div>
                          <div className="col-span-2">
                            <LabelSm>Açıklama</LabelSm>
                            <input
                              type="text"
                              value={newOpt.description}
                              onChange={(e) => setNewOpt({ ...newOpt, description: e.target.value })}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                              placeholder="Kısa açıklama"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={addOption}
                            className="px-3 py-1.5 bg-[#0D297B] text-white text-xs font-semibold rounded-lg hover:bg-[#201652]"
                          >
                            Ekle
                          </button>
                          <button
                            onClick={() => setAddingOption(false)}
                            className="px-3 py-1.5 border border-gray-200 text-xs font-semibold rounded-lg hover:bg-gray-50"
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Extra Content Preview (for info screens) */}
              {current.selectMode === "none" && current.extraContent && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Ek İçerik Önizleme</h3>
                  <ExtraContentPreview json={current.extraContent} />
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={saveScreen}
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#0D297B] text-white font-semibold rounded-lg hover:bg-[#201652] disabled:opacity-50 transition-colors"
                >
                  {saving ? "Kaydediliyor..." : "Tüm Değişiklikleri Kaydet"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              Soldan bir ekran seçin
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-gray-500 mb-1">{children}</label>;
}

function LabelSm({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-semibold text-gray-400 mb-0.5 uppercase tracking-wider">{children}</label>;
}

function ExtraContentPreview({ json }: { json: string }) {
  try {
    const data = JSON.parse(json);
    const keys = Object.keys(data);
    return (
      <div className="space-y-2 text-xs">
        {keys.map((key) => (
          <div key={key} className="flex gap-2">
            <span className="font-mono text-blue-600 shrink-0">{key}:</span>
            <span className="text-gray-600 break-all">
              {typeof data[key] === "string"
                ? data[key]
                : JSON.stringify(data[key]).slice(0, 120) + (JSON.stringify(data[key]).length > 120 ? "..." : "")}
            </span>
          </div>
        ))}
      </div>
    );
  } catch {
    return <div className="text-xs text-red-500">Geçersiz JSON</div>;
  }
}
