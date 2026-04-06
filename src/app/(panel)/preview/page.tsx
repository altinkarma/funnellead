"use client";

import { useState } from "react";

export default function PreviewPage() {
  const [device, setDevice] = useState<"mobile" | "tablet" | "desktop">("mobile");

  const widths = { mobile: 390, tablet: 768, desktop: 1024 };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Funnel Önizleme</h1>
          <p className="text-sm text-gray-500 mt-1">Canlı funnel önizlemesi — DB&apos;den okuyan dinamik versiyon · 30+&apos;dan fazla sigorta firmasından teklif veriyoruz</p>
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {(["mobile", "tablet", "desktop"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                device === d ? "bg-[#0D297B] text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {d === "mobile" ? "📱 Mobil" : d === "tablet" ? "📋 Tablet" : "🖥 Desktop"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <div
          className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden transition-all duration-300"
          style={{ width: widths[device], height: device === "mobile" ? 780 : 700 }}
        >
          <iframe
            src="/f"
            className="w-full h-full border-0"
            title="Funnel Preview"
          />
        </div>
      </div>

      <div className="mt-4 text-center">
        <a
          href="/f"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-[#0D297B] font-semibold hover:underline"
        >
          Yeni sekmede aç ↗
        </a>
      </div>
    </div>
  );
}
