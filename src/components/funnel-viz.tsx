"use client";

export default function FunnelViz({
  steps,
  maxCount,
}: {
  steps: { step: string; label: string; count: number }[];
  maxCount: number;
}) {
  return (
    <div className="space-y-2">
      {steps.map((s, i) => {
        const pct = maxCount > 0 ? (s.count / maxCount) * 100 : 0;
        const prevPct = i > 0 && maxCount > 0 ? (steps[i - 1].count / maxCount) * 100 : 100;
        const dropPct = i > 0 && steps[i - 1].count > 0
          ? (((steps[i - 1].count - s.count) / steps[i - 1].count) * 100).toFixed(0)
          : null;

        return (
          <div key={s.step} className="flex items-center gap-3">
            <div className="w-28 text-right text-xs font-medium text-gray-600 shrink-0">
              {s.label}
            </div>
            <div className="flex-1 relative">
              <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-2"
                  style={{
                    width: `${Math.max(pct, 4)}%`,
                    background: `linear-gradient(90deg, ${
                      i <= 2 ? "#0D297B" : i <= 5 ? "#1A3A9C" : i <= 7 ? "#01BB77" : "#16A34A"
                    }, ${
                      i <= 2 ? "#1A3A9C" : i <= 5 ? "#3B82F6" : i <= 7 ? "#22C55E" : "#22C55E"
                    })`,
                  }}
                >
                  <span className="text-white text-[11px] font-bold">{s.count}</span>
                </div>
              </div>
            </div>
            <div className="w-14 text-xs shrink-0">
              {dropPct !== null && (
                <span className={`font-semibold ${
                  parseInt(dropPct) > 30 ? "text-red-500" :
                  parseInt(dropPct) > 15 ? "text-amber-500" :
                  "text-green-500"
                }`}>
                  -{dropPct}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
