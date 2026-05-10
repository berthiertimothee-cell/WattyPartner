import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Severity } from "@/lib/types";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("card", className)}>{children}</div>;
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
      <div>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-10 text-center">
      <div className="text-sm font-medium text-ink">{title}</div>
      {hint && <div className="text-xs text-muted">{hint}</div>}
    </div>
  );
}

const SEVERITY_STYLE: Record<Severity, string> = {
  info: "bg-slate-100 text-slate-700",
  opportunity: "bg-emerald-50 text-success",
  warning: "bg-amber-50 text-warning",
  critical: "bg-red-50 text-danger",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <span className={cn("badge capitalize", SEVERITY_STYLE[severity])}>{severity}</span>;
}

export function PositionBadge({ position }: { position: "underpriced" | "aligned" | "overpriced" | "unknown" }) {
  const map: Record<string, string> = {
    underpriced: "bg-emerald-50 text-success",
    aligned: "bg-slate-100 text-slate-700",
    overpriced: "bg-amber-50 text-warning",
    unknown: "bg-slate-100 text-slate-500",
  };
  return <span className={cn("badge capitalize", map[position])}>{position}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-blue-50 text-brand-600",
    accepted: "bg-emerald-50 text-success",
    dismissed: "bg-slate-100 text-slate-500",
    exported: "bg-indigo-50 text-indigo-600",
    active: "bg-emerald-50 text-success",
    maintenance: "bg-amber-50 text-warning",
    planned: "bg-slate-100 text-slate-600",
  };
  return <span className={cn("badge capitalize", map[status] ?? "bg-slate-100 text-slate-600")}>{status}</span>;
}

export function GapPill({ gapPct }: { gapPct: number | null }) {
  if (gapPct === null) return <span className="badge bg-slate-100 text-slate-500">n/a</span>;
  const pct = gapPct * 100;
  const cls = pct > 5 ? "bg-amber-50 text-warning" : pct < -5 ? "bg-emerald-50 text-success" : "bg-slate-100 text-slate-700";
  return (
    <span className={cn("badge tabular-nums", cls)}>
      {pct >= 0 ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneCls =
    tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : tone === "danger" ? "text-danger" : "text-ink";
  return (
    <div>
      <div className="stat-label">{label}</div>
      <div className={cn("mt-1 text-lg font-semibold tabular-nums", toneCls)}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function LinkButton({ href, children, variant = "secondary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" | "ghost" }) {
  const cls = variant === "primary" ? "btn-primary" : variant === "ghost" ? "btn-ghost" : "btn-secondary";
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
