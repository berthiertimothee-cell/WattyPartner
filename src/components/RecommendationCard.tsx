"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Recommendation, RecommendationStatus } from "@/lib/types";
import { SeverityBadge, StatusBadge } from "@/components/ui";
import { formatDelta, formatMoney, formatSignedPercent } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  lower_price: "Lower price",
  raise_price: "Raise price",
  happy_hour: "Happy hour",
  hold_price: "Hold price",
  promo_test: "Promo test",
};

export function RecommendationCard({
  rec,
  siteName,
  compact = false,
}: {
  rec: Recommendation;
  siteName?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<RecommendationStatus>(rec.status);
  const [busy, setBusy] = useState(false);

  async function update(next: RecommendationStatus) {
    setBusy(true);
    try {
      const res = await fetch(`/api/recommendations/${rec.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) {
        setStatus(next);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  function exportRec() {
    const blob = new Blob([JSON.stringify(rec, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${rec.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    update("exported");
  }

  const cur = "EUR";
  const impact = rec.estimatedImpact;

  return (
    <div className="card card-pad">
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge bg-slate-100 text-slate-700">{TYPE_LABEL[rec.type] ?? rec.type}</span>
        <SeverityBadge severity={rec.severity} />
        {rec.window && <span className="badge bg-blue-50 text-brand-600">{rec.window}</span>}
        <span className="ml-auto"><StatusBadge status={status} /></span>
      </div>

      <h3 className="mt-3 text-sm font-semibold text-ink">{rec.title}</h3>
      {siteName && (
        <Link href={`/sites/${rec.siteId}`} className="text-xs font-medium text-brand-600 hover:underline">
          {siteName}
        </Link>
      )}
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{rec.rationale}</p>
      <p className="mt-2 text-sm font-medium text-ink">{rec.action}</p>

      {!compact && (
        <div className="mt-3 grid grid-cols-3 gap-3 rounded-lg bg-canvas p-3 text-center">
          <div>
            <div className="stat-label">Price change</div>
            <div className="mt-0.5 text-sm font-semibold tabular-nums text-ink">{rec.suggestedPriceDelta === null ? "—" : formatDelta(rec.suggestedPriceDelta, cur, 2)}</div>
          </div>
          <div>
            <div className="stat-label">Sessions</div>
            <div className="mt-0.5 text-sm font-semibold tabular-nums text-ink">{impact.sessionsChangePct === undefined ? "—" : formatSignedPercent(impact.sessionsChangePct)}</div>
          </div>
          <div>
            <div className="stat-label">Revenue / mo</div>
            <div className={"mt-0.5 text-sm font-semibold tabular-nums " + ((impact.revenueChangePerMonth ?? 0) >= 0 ? "text-success" : "text-danger")}>
              {impact.revenueChangePerMonth === undefined ? "—" : (impact.revenueChangePerMonth >= 0 ? "+" : "−") + formatMoney(Math.abs(impact.revenueChangePerMonth), cur)}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button className="btn-primary" disabled={busy || status === "accepted"} onClick={() => update("accepted")}>
          {status === "accepted" ? "Accepted" : "Accept"}
        </button>
        <button className="btn-secondary" disabled={busy || status === "dismissed"} onClick={() => update("dismissed")}>
          Dismiss
        </button>
        <button className="btn-ghost" disabled={busy} onClick={exportRec}>
          Export
        </button>
        {status !== "open" && (
          <button className="btn-ghost ml-auto text-xs" disabled={busy} onClick={() => update("open")}>
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
