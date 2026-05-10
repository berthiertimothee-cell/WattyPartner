"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Alert } from "@/lib/types";
import { SeverityBadge, EmptyState } from "@/components/ui";
import { relativeDate } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  competitor_price_change: "Competitor price change",
  site_overpriced: "Overpriced",
  site_underpriced: "Underpriced",
  utilization_drop: "Utilization drop",
  revenue_opportunity: "Revenue opportunity",
  high_demand_window: "High-demand window",
};

export function AlertsPanel({
  alerts,
  siteNames = {},
  showSite = true,
  limit,
}: {
  alerts: Alert[];
  siteNames?: Record<string, string>;
  showSite?: boolean;
  limit?: number;
}) {
  const router = useRouter();
  const [readIds, setReadIds] = useState<Set<string>>(new Set(alerts.filter((a) => a.read).map((a) => a.id)));
  const [busy, setBusy] = useState(false);

  const shown = limit ? alerts.slice(0, limit) : alerts;

  async function markRead(id: string) {
    setReadIds((s) => new Set(s).add(id));
    await fetch(`/api/alerts/${id}`, { method: "PATCH" });
    router.refresh();
  }
  async function markAll() {
    setBusy(true);
    setReadIds(new Set(alerts.map((a) => a.id)));
    await fetch("/api/alerts", { method: "POST" });
    router.refresh();
    setBusy(false);
  }

  if (shown.length === 0) return <EmptyState title="No alerts" hint="You're all caught up." />;

  return (
    <div>
      <div className="divide-y divide-slate-100">
        {shown.map((a) => {
          const read = readIds.has(a.id);
          return (
            <div key={a.id} className="flex items-start gap-3 px-1 py-3">
              <span className={"mt-1.5 h-2 w-2 shrink-0 rounded-full " + (read ? "bg-slate-200" : a.severity === "critical" ? "bg-danger" : a.severity === "warning" ? "bg-warning" : a.severity === "opportunity" ? "bg-success" : "bg-brand-600")} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-ink">{a.title}</span>
                  <SeverityBadge severity={a.severity} />
                  <span className="text-[11px] text-muted">{TYPE_LABEL[a.type] ?? a.type}</span>
                  <span className="ml-auto text-[11px] text-slate-400">{relativeDate(a.createdAt)}</span>
                </div>
                <p className="mt-0.5 text-sm text-slate-600">{a.message}</p>
                <div className="mt-1 flex items-center gap-3 text-xs">
                  {showSite && siteNames[a.siteId] && (
                    <Link href={`/sites/${a.siteId}`} className="font-medium text-brand-600 hover:underline">
                      {siteNames[a.siteId]}
                    </Link>
                  )}
                  {!read && (
                    <button className="text-slate-400 hover:text-ink" onClick={() => markRead(a.id)}>
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {alerts.some((a) => !readIds.has(a.id)) && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <button className="btn-ghost text-xs" disabled={busy} onClick={markAll}>
            Mark all read
          </button>
        </div>
      )}
    </div>
  );
}
