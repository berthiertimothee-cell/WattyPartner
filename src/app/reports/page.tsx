import Link from "next/link";
import { getOrganization, getReports } from "@/lib/data";
import { Card, CardHeader, PageHeader, Stat } from "@/components/ui";
import { ReportActions } from "@/components/ReportActions";
import { formatDelta, formatMoney, formatPercent, formatPrice, formatSignedPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams: { id?: string } }) {
  const [org, reports] = await Promise.all([getOrganization(), getReports()]);
  const active = (searchParams.id && reports.find((r) => r.id === searchParams.id)) || reports[0];
  const s = active.summary;
  const gapPct = s.competitorAvgPricePerKwh ? (s.avgPricePerKwh - s.competitorAvgPricePerKwh) / s.competitorAvgPricePerKwh : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Monthly pricing performance & revenue opportunity"
        actions={<ReportActions report={active} />}
      />

      <div className="flex flex-wrap items-center gap-2">
        {reports.map((r) => {
          const isActive = r.id === active.id;
          return (
            <Link key={r.id} href={`/reports?id=${r.id}`} className={"badge px-3 py-1.5 text-sm " + (isActive ? "bg-brand text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50")}>
              {r.periodLabel}
            </Link>
          );
        })}
      </div>

      <Card className="card-pad">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">{org.name} — Pricing & Revenue Report</h2>
            <p className="text-sm text-muted">Period: {active.periodLabel} · Generated {new Date(active.generatedAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Avg price / kWh" value={formatPrice(s.avgPricePerKwh, org.currency)} />
          <Stat label="Competitor avg" value={formatPrice(s.competitorAvgPricePerKwh, org.currency)} sub={formatSignedPercent(gapPct) + " gap"} />
          <Stat label="Avg utilization" value={formatPercent(s.avgUtilization)} />
          <Stat label="Total revenue / mo" value={formatMoney(s.totalRevenue, org.currency)} />
          <Stat label="Revenue opportunity" value={formatMoney(s.revenueOpportunity, org.currency)} tone="success" />
          <Stat label="Recommended actions" value={s.recommendedActions} tone="warning" />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Pricing performance" />
          <div className="card-pad space-y-2 text-sm text-slate-600">
            <p>{s.pricingPerformanceNote}</p>
            <p>{s.benchmarkNote}</p>
          </div>
        </Card>
        <Card>
          <CardHeader title="Benchmark vs. competitors" />
          <div className="card-pad text-sm text-slate-600">
            <p>
              Portfolio average is {formatPrice(s.avgPricePerKwh, org.currency)} vs. a local competitor average of {formatPrice(s.competitorAvgPricePerKwh, org.currency)} — a gap of {formatSignedPercent(gapPct)}.
            </p>
            <p className="mt-2">{s.revenueOpportunity > 0 ? `Acting on the open recommendations is estimated to add ${formatMoney(s.revenueOpportunity, org.currency)} per month.` : "No material revenue opportunity is currently flagged."}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Top underperforming sites" subtitle="Lowest utilization" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th className="px-5 py-3">Site</th><th className="px-5 py-3">Utilization</th><th className="px-5 py-3">Note</th></tr></thead>
              <tbody>
                {s.topUnderperformingSites.map((u) => (
                  <tr key={u.siteId} className="table-row">
                    <td className="px-5 py-3"><Link href={`/sites/${u.siteId}`} className="font-medium text-ink hover:text-brand-600">{u.siteName}</Link></td>
                    <td className="px-5 py-3 tabular-nums">{formatPercent(u.utilization)}</td>
                    <td className="px-5 py-3 text-muted">{u.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <CardHeader title="Top price-increase opportunities" subtitle="Highest estimated monthly upside" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th className="px-5 py-3">Site</th><th className="px-5 py-3">Suggested change</th><th className="px-5 py-3">Note</th></tr></thead>
              <tbody>
                {s.topPriceIncreaseOpportunities.length === 0 ? (
                  <tr><td colSpan={3} className="px-5 py-6 text-center text-sm text-muted">No price-increase opportunities this period.</td></tr>
                ) : (
                  s.topPriceIncreaseOpportunities.map((o) => (
                    <tr key={o.siteId} className="table-row">
                      <td className="px-5 py-3"><Link href={`/sites/${o.siteId}`} className="font-medium text-ink hover:text-brand-600">{o.siteName}</Link></td>
                      <td className="px-5 py-3 tabular-nums">{formatDelta(o.suggestedDelta, org.currency, 2)}/kWh</td>
                      <td className="px-5 py-3 text-muted">{o.note}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Recommended actions summary" />
        <div className="card-pad text-sm text-slate-600">
          <p>{s.recommendedActions} open recommendations across the portfolio. Review the full list and accept, dismiss or export each one from the <Link href="/recommendations" className="font-medium text-brand-600 hover:underline">Recommendations</Link> page.</p>
        </div>
      </Card>
    </div>
  );
}
