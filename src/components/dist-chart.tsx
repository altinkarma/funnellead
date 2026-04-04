"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function DistChart({
  data,
  color,
}: {
  data: { name: string; value: number }[];
  color: string;
}) {
  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} />
          <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,.08)",
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Sayı">
            {data.map((_, idx) => (
              <Cell key={idx} fill={color} opacity={0.7 + (idx / data.length) * 0.3} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
