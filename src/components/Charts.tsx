"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney, formatMoneyCompact, formatMonthShort, formatNumber } from "@/lib/utils";

const BRAND = "#1E4ED8";
const INK = "#0B1F4D";
const GRID = "#EEF2F6";

// Charts are Client Components, so props must be serialisable — callers pass a
// `format` key (not a function) and the chart resolves the formatter here.
export type ChartFormat = "raw" | "money" | "moneyCompact" | "number" | "percent" | "kw" | "eurkwh";
function fmt(kind: ChartFormat = "raw"): (v: number) => string {
  switch (kind) {
    case "money":
      return (v) => formatMoney(v);
    case "moneyCompact":
      return (v) => formatMoneyCompact(v);
    case "number":
      return (v) => formatNumber(v);
    case "percent":
      return (v) => `${v}%`;
    case "kw":
      return (v) => `${v} kW`;
    case "eurkwh":
      return (v) => `€${v.toFixed(2)}`;
    default:
      return (v) => String(v);
  }
}

const axisProps = { tick: { fontSize: 11, fill: "#94A3B8" }, axisLine: false, tickLine: false } as const;

function tipStyle() {
  return {
    contentStyle: { borderRadius: 12, border: "1px solid #E2E8F0", boxShadow: "0 8px 24px rgba(16,24,40,0.08)", fontSize: 12, padding: "8px 10px" },
    labelStyle: { color: "#6B7280", fontWeight: 600, marginBottom: 2 },
    itemStyle: { color: "#111827" },
  } as const;
}

type Datum = Record<string, number | string>;

export function AreaTrendChart({ data, xKey, yKey, label, color = BRAND, height = 200, format = "raw", isMonthKey = true }: { data: Datum[]; xKey: string; yKey: string; label?: string; color?: string; height?: number; format?: ChartFormat; isMonthKey?: boolean }) {
  const f = fmt(format);
  const id = `g_${yKey}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} {...axisProps} tickFormatter={isMonthKey ? (v) => formatMonthShort(String(v)) : undefined} minTickGap={16} />
        <YAxis {...axisProps} width={52} tickFormatter={(v) => f(Number(v))} />
        <Tooltip {...tipStyle()} formatter={(v: number) => [f(v), label ?? yKey]} labelFormatter={isMonthKey ? (l) => formatMonthShort(String(l)) : undefined} />
        <Area type="monotone" dataKey={yKey} stroke={color} strokeWidth={2.25} fill={`url(#${id})`} dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function LineTrendChart({ data, xKey, yKey, color = INK, height = 180, format = "raw", domain, isMonthKey = true, label }: { data: Datum[]; xKey: string; yKey: string; color?: string; height?: number; format?: ChartFormat; domain?: [number, number]; isMonthKey?: boolean; label?: string }) {
  const f = fmt(format);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} {...axisProps} tickFormatter={isMonthKey ? (v) => formatMonthShort(String(v)) : undefined} minTickGap={16} />
        <YAxis {...axisProps} width={48} domain={domain} tickFormatter={(v) => f(Number(v))} />
        <Tooltip {...tipStyle()} formatter={(v: number) => [f(v), label ?? yKey]} labelFormatter={isMonthKey ? (l) => formatMonthShort(String(l)) : undefined} />
        <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BarSeriesChart({ data, xKey, yKey, color = BRAND, height = 200, format = "raw", isMonthKey = true, label }: { data: Datum[]; xKey: string; yKey: string; color?: string; height?: number; format?: ChartFormat; isMonthKey?: boolean; label?: string }) {
  const f = fmt(format);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} {...axisProps} tickFormatter={isMonthKey ? (v) => formatMonthShort(String(v)) : undefined} minTickGap={8} />
        <YAxis {...axisProps} width={52} tickFormatter={(v) => f(Number(v))} />
        <Tooltip {...tipStyle()} cursor={{ fill: "rgba(30,78,216,0.06)" }} formatter={(v: number) => [f(v), label ?? yKey]} labelFormatter={isMonthKey ? (l) => formatMonthShort(String(l)) : undefined} />
        <Bar dataKey={yKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Horizontal comparison bars — used for the competitor price/power benchmark. */
export function HBarCompareChart({ data, height = 200, format = "raw" }: { data: { label: string; value: number; highlight?: boolean }[]; height?: number; format?: ChartFormat }) {
  const f = fmt(format);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 8 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" {...axisProps} tickFormatter={(v) => f(Number(v))} />
        <YAxis type="category" dataKey="label" {...axisProps} width={140} />
        <Tooltip {...tipStyle()} cursor={{ fill: "rgba(30,78,216,0.06)" }} formatter={(v: number) => [f(v), ""]} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.highlight ? INK : "#CBD5E1"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Sparkline({ data, yKey, color = BRAND, height = 40 }: { data: Datum[]; yKey: string; color?: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spk_${yKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey={yKey} stroke={color} strokeWidth={1.75} fill={`url(#spk_${yKey})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
