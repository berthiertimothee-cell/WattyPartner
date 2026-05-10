import Link from "next/link";
import { cn, formatSignedPercent, initials } from "@/lib/utils";
import type { Severity } from "@/lib/types";
import { ArrowUpRight, ChevronRight } from "./Icons";

// ---------------------------------------------------------------------------
// Layout primitives
// ---------------------------------------------------------------------------

export function PageHeader({ title, subtitle, actions, breadcrumb }: { title: string; subtitle?: string; actions?: React.ReactNode; breadcrumb?: { label: string; href: string }[] }) {
  return (
    <div className="mb-6 animate-fade-in">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="mb-2 flex items-center gap-1.5 text-xs text-muted">
          {breadcrumb.map((b, i) => (
            <span key={b.href} className="flex items-center gap-1.5">
              <Link href={b.href} className="hover:text-ink">
                {b.label}
              </Link>
              {i < breadcrumb.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("card", className)}>{children}</div>;
}

export function CardHeader({ title, subtitle, action, icon }: { title: string; subtitle?: string; action?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 text-brand-600">{icon}</div>}
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="section-title">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {icon && <div className="text-slate-300">{icon}</div>}
      <div className="text-sm font-medium text-ink">{title}</div>
      {hint && <div className="max-w-sm text-xs text-muted">{hint}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Buttons & links
// ---------------------------------------------------------------------------

export function LinkButton({ href, children, variant = "secondary", className }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" | "ghost"; className?: string }) {
  const cls = variant === "primary" ? "btn-primary" : variant === "ghost" ? "btn-ghost" : "btn-secondary";
  return (
    <Link href={href} className={cn(cls, className)}>
      {children}
    </Link>
  );
}

/** Visual-only button (the demo has no mutating backend). */
export function ActionButton({ children, variant = "secondary", className, title }: { children: React.ReactNode; variant?: "primary" | "secondary" | "ghost"; className?: string; title?: string }) {
  const cls = variant === "primary" ? "btn-primary" : variant === "ghost" ? "btn-ghost" : "btn-secondary";
  return (
    <span className={cn(cls, "cursor-default select-none", className)} title={title}>
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

const SEVERITY_STYLE: Record<Severity, string> = {
  info: "bg-slate-100 text-slate-600",
  opportunity: "bg-emerald-50 text-success",
  warning: "bg-amber-50 text-warning",
  critical: "bg-red-50 text-danger",
};
export function SeverityBadge({ severity }: { severity: Severity }) {
  return <span className={cn("badge capitalize", SEVERITY_STYLE[severity])}>{severity}</span>;
}

const TONE_STYLE = {
  neutral: "bg-slate-100 text-slate-600",
  blue: "bg-blue-50 text-brand-600",
  green: "bg-emerald-50 text-success",
  amber: "bg-amber-50 text-warning",
  red: "bg-red-50 text-danger",
  violet: "bg-violet-50 text-violet-700",
} as const;
export type Tone = keyof typeof TONE_STYLE;

export function Badge({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return <span className={cn("badge", TONE_STYLE[tone], className)}>{children}</span>;
}

export function Dot({ tone = "neutral" }: { tone?: Tone }) {
  const c = { neutral: "bg-slate-400", blue: "bg-brand-600", green: "bg-success", amber: "bg-warning", red: "bg-danger", violet: "bg-violet-600" }[tone];
  return <span className={cn("inline-block h-1.5 w-1.5 rounded-full", c)} />;
}

// ---------------------------------------------------------------------------
// Stats / KPI tiles
// ---------------------------------------------------------------------------

export function Stat({ label, value, sub, tone, className }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "default" | "success" | "warning" | "danger"; className?: string }) {
  const toneCls = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : tone === "danger" ? "text-danger" : "text-ink";
  return (
    <div className={className}>
      <div className="stat-label">{label}</div>
      <div className={cn("mt-1 text-lg font-semibold tabular-nums", toneCls)}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function DeltaPill({ delta, invert = false }: { delta: number | null; invert?: boolean }) {
  if (delta === null || Number.isNaN(delta)) return <span className="badge bg-slate-100 text-slate-400">—</span>;
  const positive = invert ? delta < 0 : delta >= 0;
  const cls = Math.abs(delta) < 0.005 ? "bg-slate-100 text-slate-500" : positive ? "bg-emerald-50 text-success" : "bg-red-50 text-danger";
  return <span className={cn("badge tabular-nums", cls)}>{formatSignedPercent(delta, 1)}</span>;
}

export function KpiTile({ label, value, delta, icon, sub, href, deltaInvert }: { label: string; value: React.ReactNode; delta?: number | null; icon?: React.ReactNode; sub?: React.ReactNode; href?: string; deltaInvert?: boolean }) {
  const inner = (
    <div className="card card-pad transition-shadow hover:shadow-cardHover">
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        {icon && <span className="text-slate-300">{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums text-ink">{value}</span>
        {delta !== undefined && <DeltaPill delta={delta ?? null} invert={deltaInvert} />}
      </div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
      {href && (
        <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600">
          View <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export function ProgressBar({ value, tone = "blue", className }: { value: number; tone?: "blue" | "green" | "amber"; className?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const bar = { blue: "bg-brand-600", green: "bg-success", amber: "bg-warning" }[tone];
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}>
      <div className={cn("h-full rounded-full transition-all", bar)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Avatar({ name, color, size = 36 }: { name: string; color?: string; size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white" style={{ width: size, height: size, backgroundColor: color ?? "#0B1F4D", fontSize: size * 0.38 }}>
      {initials(name)}
    </span>
  );
}

/** A solid-colour "photo" placeholder with a subtle gradient — stands in for site imagery in the demo. */
export function PhotoPlaceholder({ color, label, className, height = 160 }: { color: string; label?: string; className?: string; height?: number }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)} style={{ height }}>
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}cc 55%, ${color}99 100%)` }} />
      <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,.5), transparent 40%)" }} />
      {label && <div className="absolute bottom-3 left-4 text-xs font-medium text-white/90">{label}</div>}
    </div>
  );
}

export function KeyValue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}
