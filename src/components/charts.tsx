"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { UtilizationPoint } from "@/lib/types";

const AXIS = { fontSize: 11, fill: "#6B7280" };
const GRID = "#eef2f7";

export function UtilizationChart({ hourly, height = 220 }: { hourly: UtilizationPoint[]; height?: number }) {
  const data = hourly.map((h) => ({ hour: `${String(h.hour).padStart(2, "0")}h`, util: Math.round(h.utilization * 100), sessions: h.sessions }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="vy-util" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E4ED8" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#1E4ED8" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="hour" tick={AXIS} interval={2} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
        <Tooltip
          contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
          formatter={(v: number, name) => (name === "util" ? [`${v}%`, "Utilization"] : [v, "Sessions/h"])}
        />
        <Area type="monotone" dataKey="util" stroke="#1E4ED8" strokeWidth={2} fill="url(#vy-util)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeekdayBars({ weekday, height = 200 }: { weekday: number[]; height?: number }) {
  const data = weekday.map((u, i) => ({ day: WEEKDAYS[i] ?? `D${i}`, util: Math.round(u * 100) }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="day" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
        <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v: number) => [`${v}%`, "Utilization"]} />
        <Bar dataKey="util" radius={[4, 4, 0, 0]} fill="#0B1F4D" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PriceComparisonChart({
  ourLabel,
  ourPrice,
  competitors,
  currency = "EUR",
  height = 220,
}: {
  ourLabel: string;
  ourPrice: number;
  competitors: { name: string; price: number | null }[];
  currency?: string;
  height?: number;
}) {
  const sym = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  const priced = competitors.filter((c) => c.price !== null) as { name: string; price: number }[];
  const avg = priced.length ? priced.reduce((s, c) => s + c.price, 0) / priced.length : null;
  const data = [
    { name: ourLabel, price: ourPrice, mine: true },
    ...priced.map((c) => ({ name: c.name, price: c.price, mine: false })),
  ];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} domain={[0, "dataMax + 0.05"]} tickFormatter={(v) => `${sym}${v.toFixed(2)}`} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} width={150} />
        <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v: number) => [`${sym}${v.toFixed(3)}/kWh`, "Price"]} />
        {avg !== null && <ReferenceLine x={avg} stroke="#6B7280" strokeDasharray="4 4" label={{ value: `avg ${sym}${avg.toFixed(2)}`, position: "top", fontSize: 11, fill: "#6B7280" }} />}
        <Bar dataKey="price" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.mine ? "#0B1F4D" : "#94a3b8"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
