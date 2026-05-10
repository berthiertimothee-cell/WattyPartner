import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CURRENCY_SYMBOL: Record<string, string> = { EUR: "€", USD: "$", GBP: "£" };

export function currencySymbol(currency = "EUR") {
  return CURRENCY_SYMBOL[currency] ?? currency + " ";
}

/** Compact money, e.g. €12.4k / €1.2M. Good for KPI tiles. */
export function formatMoneyCompact(value: number | null | undefined, currency = "EUR") {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const sym = currencySymbol(currency);
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (abs >= 1_000_000) return `${sign}${sym}${(abs / 1_000_000).toFixed(abs >= 1e7 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${sign}${sym}${(abs / 1_000).toFixed(abs >= 1e5 ? 0 : 1)}k`;
  return `${sign}${sym}${Math.round(abs).toLocaleString("en-US")}`;
}

export function formatMoney(value: number | null | undefined, currency = "EUR") {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const sym = currencySymbol(currency);
  return `${value < 0 ? "−" : ""}${sym}${Math.abs(Math.round(value)).toLocaleString("en-US")}`;
}

export function formatPrice(value: number | null | undefined, currency = "EUR", digits = 3) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${currencySymbol(currency)}${value.toFixed(digits)}`;
}

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Math.round(value).toLocaleString("en-US");
}

export function formatPercent(value: number | null | undefined, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatSignedPercent(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const pct = value * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(digits)}%`;
}

export function formatKwh(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} GWh`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(abs >= 1e5 ? 0 : 1)} MWh`;
  return `${Math.round(value).toLocaleString("en-US")} kWh`;
}

const DATE_FMT = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const DATE_FMT_SHORT = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" });
const DATETIME_FMT = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const MONTH_FMT = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return DATE_FMT.format(new Date(iso));
}
export function formatDateShort(iso: string | null | undefined) {
  if (!iso) return "—";
  return DATE_FMT_SHORT.format(new Date(iso));
}
export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return DATETIME_FMT.format(new Date(iso));
}
/** Accepts a "YYYY-MM" key or an ISO date. */
export function formatMonth(key: string) {
  const iso = /^\d{4}-\d{2}$/.test(key) ? `${key}-01T00:00:00Z` : key;
  return MONTH_FMT.format(new Date(iso));
}
/** Short month label for charts, e.g. "Apr". */
export function formatMonthShort(key: string) {
  const iso = /^\d{4}-\d{2}$/.test(key) ? `${key}-01T00:00:00Z` : key;
  return new Date(iso).toLocaleDateString("en-GB", { month: "short" });
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.round((now - then) / 1000);
  const future = diff < 0;
  const a = Math.abs(diff);
  let out: string;
  if (a < 60) return "just now";
  if (a < 3600) out = `${Math.floor(a / 60)}m`;
  else if (a < 86400) out = `${Math.floor(a / 3600)}h`;
  else if (a < 86400 * 30) out = `${Math.floor(a / 86400)}d`;
  else if (a < 86400 * 365) out = `${Math.floor(a / (86400 * 30))}mo`;
  else out = `${Math.floor(a / (86400 * 365))}y`;
  return future ? `in ${out}` : `${out} ago`;
}

export function daysBetween(aIso: string, bIso: string): number {
  return Math.round((new Date(bIso).getTime() - new Date(aIso).getTime()) / 86_400_000);
}
export function daysFromNow(iso: string): number {
  return Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 100) / 100;
}

export function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
export function round(value: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function titleCase(s: string): string {
  return s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
