import Link from "next/link";
import type { Notification, Severity } from "@/lib/types";
import { cn, relativeTime, titleCase } from "@/lib/utils";
import { AlertTriangleIcon, ArrowUpRight, BellIcon, ChartIcon, ClockIcon } from "./Icons";

const TONE: Record<Severity, { wrap: string; icon: string }> = {
  critical: { wrap: "bg-red-50", icon: "text-danger" },
  warning: { wrap: "bg-amber-50", icon: "text-warning" },
  opportunity: { wrap: "bg-emerald-50", icon: "text-success" },
  info: { wrap: "bg-slate-100", icon: "text-slate-500" },
};

function iconFor(n: Notification) {
  if (n.severity === "opportunity") return ChartIcon;
  if (n.type === "unresolved_incident" || n.severity === "critical") return AlertTriangleIcon;
  if (n.type === "deployment_delay" || n.type === "partner_inactivity") return ClockIcon;
  return BellIcon;
}

export function AlertRow({ n, partnerName }: { n: Notification; partnerName?: string }) {
  const Icon = iconFor(n);
  const t = TONE[n.severity];
  const body = (
    <div className={cn("flex gap-3 rounded-xl p-3 transition-colors", n.href && "hover:bg-slate-50")}>
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", t.wrap)}>
        <Icon className={cn("h-4.5 w-4.5", t.icon)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-ink">{n.title}</p>
          <span className="shrink-0 text-[11px] text-slate-400">{relativeTime(n.createdAt)}</span>
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{n.body}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
          <span className="pill !px-2 !py-0.5 !text-[11px]">{titleCase(n.type)}</span>
          {partnerName && <span>· {partnerName}</span>}
          {!n.read && <span className="inline-flex items-center gap-1 text-brand-600">· unread</span>}
        </div>
      </div>
      {n.href && <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />}
    </div>
  );
  return n.href ? (
    <Link href={n.href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

export function AlertsList({ items, partnerNameById }: { items: Notification[]; partnerNameById?: Map<string, string> }) {
  if (!items.length) return <p className="px-5 py-8 text-center text-sm text-muted">No alerts — everything looks healthy.</p>;
  return (
    <div className="divide-y divide-slate-100">
      {items.map((n) => (
        <div key={n.id} className="px-2 py-1">
          <AlertRow n={n} partnerName={n.partnerId ? partnerNameById?.get(n.partnerId) : undefined} />
        </div>
      ))}
    </div>
  );
}
