"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function TrendChart({
  data,
  dataKey = "value",
  color = "#e11d48",
  unit,
}: {
  data: { label: string; value: number }[];
  dataKey?: string;
  color?: string;
  unit?: string;
}) {
  if (data.length < 2) {
    return (
      <p className="py-8 text-center text-sm text-zinc-400">
        Log a few more entries to see a trend chart.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "currentColor" }}
          className="text-zinc-400"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "currentColor" }}
          className="text-zinc-400"
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          formatter={(value) => [`${value}${unit ?? ""}`, ""]}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={{ r: 3 }}
          name={dataKey}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
