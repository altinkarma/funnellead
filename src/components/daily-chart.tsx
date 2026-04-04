"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function DailyChart({ data }: { data: { date: string; count: number }[] }) {
  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0D297B" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#0D297B" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
          <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,.08)",
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#0D297B"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorLeads)"
            name="Lead"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
