import Link from "next/link";
import type { KpiSummary } from "@/lib/types";
import { Card } from "@/components/ui";
import { formatMoney, formatPercent, formatPrice, formatSignedPercent } from "@/lib/utils";

export function KpiCards({ kpis }: { kpis: KpiSummary }) {
  const items = [
    {
      label: "Average price / kWh",
      value: formatPrice(kpis.avgPricePerKwh, kpis.currency),
      sub: "Revenue-weighted across sites",
      href: "/sites",
    },
    {
      label: "Competitor gap",
      value: formatSignedPercent(kpis.competitorGapPct),
      sub: kpis.competitorGapPct > 0 ? "Above local averages" : "Below local averages",
      href: "/competitors",
      tone: Math.abs(kpis.competitorGapPct) > 0.05 ? (kpis.competitorGapPct > 0 ? "warning" : "success") : "default",
    },
    {
      label: "Revenue opportunity",
      value: formatMoney(kpis.revenueOpportunity, kpis.currency),
      sub: "Est. extra /month if applied",
      href: "/recommendations",
      tone: kpis.revenueOpportunity > 0 ? "success" : "default",
    },
    {
      label: "Utilization rate",
      value: formatPercent(kpis.utilizationRate),
      sub: "Revenue-weighted, trailing 30d",
      href: "/sites",
    },
    {
      label: "Recommended actions",
      value: String(kpis.recommendedActions),
      sub: `${kpis.openAlerts} open alerts`,
      href: "/recommendations",
      tone: kpis.recommendedActions > 0 ? "warning" : "default",
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {items.map((it) => (
        <Link key={it.label} href={it.href}>
          <Card className="card-pad transition-shadow hover:shadow-cardHover">
            <div className="stat-label">{it.label}</div>
            <div
              className={
                "mt-2 text-2xl font-semibold tabular-nums " +
                (("tone" in it && it.tone === "warning")
                  ? "text-warning"
                  : "tone" in it && it.tone === "success"
                    ? "text-success"
                    : "text-ink")
              }
            >
              {it.value}
            </div>
            <div className="mt-1 text-xs text-muted">{it.sub}</div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
