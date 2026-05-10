import Link from "next/link";
import { getBenchmarks, getCompetitors, getOrganization, getSites } from "@/lib/data";
import { Card, CardHeader, GapPill, PageHeader, Stat } from "@/components/ui";
import { BenchmarkTable } from "@/components/BenchmarkTable";
import { formatPercent, formatPrice, mean, relativeDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CompetitorsPage() {
  const [org, sites, benchmarks, competitors] = await Promise.all([getOrganization(), getSites(), getBenchmarks(), getCompetitors()]);
  const operators = Array.from(new Set(competitors.map((c) => c.operatorName))).sort();
  const pricedCount = competitors.filter((c) => c.pricePerKwh !== null).length;
  const avgGap = mean(benchmarks.map((b) => b.gapPct).filter((v): v is number => v !== null));

  return (
    <div className="space-y-6">
      <PageHeader title="Competitor benchmarking" subtitle="Nearby charging stations, local pricing and your price gap" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="card-pad"><Stat label="Competitor stations" value={competitors.length} sub={`${pricedCount} with a known price`} /></Card>
        <Card className="card-pad"><Stat label="Operators tracked" value={operators.length} sub={operators.slice(0, 3).join(", ") + (operators.length > 3 ? "…" : "")} /></Card>
        <Card className="card-pad"><Stat label="Avg price gap" value={avgGap === null ? "—" : `${avgGap >= 0 ? "+" : ""}${(avgGap * 100).toFixed(1)}%`} sub="Across benchmarked sites" tone={avgGap && Math.abs(avgGap) > 0.05 ? (avgGap > 0 ? "warning" : "success") : "default"} /></Card>
        <Card className="card-pad"><Stat label="Overpriced sites" value={benchmarks.filter((b) => b.position === "overpriced").length} sub={`${benchmarks.filter((b) => b.position === "underpriced").length} underpriced`} /></Card>
      </div>

      <Card>
        <CardHeader title="Benchmark by site" subtitle="Your price vs. the local competitor average" />
        <BenchmarkTable rows={benchmarks} currency={org.currency} />
      </Card>

      <Card>
        <CardHeader title="All competitor stations" subtitle="Discovered near your sites · plug in OpenChargeMap / Google Places / roaming APIs for live data" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-5 py-3">Station</th>
                <th className="px-5 py-3">Operator</th>
                <th className="px-5 py-3">Near site</th>
                <th className="px-5 py-3">Distance</th>
                <th className="px-5 py-3">Power</th>
                <th className="px-5 py-3">Price / kWh</th>
                <th className="px-5 py-3">Availability</th>
                <th className="px-5 py-3">Gap vs us</th>
                <th className="px-5 py-3">Source</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((c) => (
                <tr key={c.id} className="table-row hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-ink">{c.name}</td>
                  <td className="px-5 py-3 text-muted">{c.operatorName}</td>
                  <td className="px-5 py-3">
                    <Link href={`/sites/${c.siteId}`} className="text-brand-600 hover:underline">{c.siteName}</Link>
                  </td>
                  <td className="px-5 py-3 tabular-nums">{c.distanceKm} km</td>
                  <td className="px-5 py-3 tabular-nums">{c.maxPowerKw} kW</td>
                  <td className="px-5 py-3 tabular-nums">{formatPrice(c.pricePerKwh, c.currency)}</td>
                  <td className="px-5 py-3 tabular-nums">{c.availability === null ? <span className="text-slate-400">n/a</span> : formatPercent(c.availability)}</td>
                  <td className="px-5 py-3"><GapPill gapPct={c.gapPct} /></td>
                  <td className="px-5 py-3 text-xs text-slate-400">{c.source} · {relativeDate(c.lastSeenAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
