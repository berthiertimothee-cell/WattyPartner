import Link from "next/link";
import { notFound } from "next/navigation";
import { getSiteDetail, getOrganization } from "@/lib/data";
import { Card, CardHeader, GapPill, PageHeader, PositionBadge, SeverityBadge, Stat, StatusBadge, EmptyState } from "@/components/ui";
import { SiteMap } from "@/components/SiteMap";
import { UtilizationChart, WeekdayBars, PriceComparisonChart } from "@/components/charts";
import { RecommendationCard } from "@/components/RecommendationCard";
import { AlertsPanel } from "@/components/AlertsPanel";
import { formatMoney, formatPercent, formatPrice, relativeDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const WEATHER_LABEL: Record<string, string> = { clear: "Clear", clouds: "Cloudy", rain: "Rain", snow: "Snow", storm: "Storm" };

export default async function SiteDetailPage({ params }: { params: { id: string } }) {
  const [detail, org] = await Promise.all([getSiteDetail(params.id), getOrganization()]);
  if (!detail) notFound();
  const { site, competitors, benchmark, utilization, demand, priceObservations, recommendations, alerts } = detail;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/sites" className="text-xs font-medium text-brand-600 hover:underline">← All sites</Link>
        <PageHeader
          title={site.name}
          subtitle={`${site.address}, ${site.city} · Operated by ${site.operatorName}`}
          actions={<StatusBadge status={site.status} />}
        />
      </div>

      {/* key stats */}
      <Card className="card-pad">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-7">
          <Stat label="Price / kWh" value={formatPrice(site.currentPricePerKwh, site.currency)} />
          <Stat label="Local avg" value={formatPrice(benchmark.competitorAvg, site.currency)} sub={<span className="inline-flex items-center gap-1">gap <GapPill gapPct={benchmark.gapPct} /></span>} />
          <Stat label="Utilization" value={formatPercent(site.utilizationRate)} tone={site.utilizationRate < org.settings.lowUtilizationThreshold ? "warning" : "default"} />
          <Stat label="Sessions / day" value={site.sessionsPerDay} />
          <Stat label="Revenue / mo" value={formatMoney(site.revenuePerMonth, site.currency)} />
          <Stat label="Uptime" value={formatPercent(site.uptime, 1)} />
          <Stat label="Max power" value={`${site.maxPowerKw} kW`} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-xs text-muted">
          <span className="font-medium text-ink">Chargers:</span>
          {site.chargers.map((c) => (
            <span key={c.id} className="badge bg-slate-100 text-slate-700">{c.count}× {c.label} · {c.powerKw} kW · {c.connectorTypes.join("/")}</span>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Location & competitors" subtitle={`${competitors.length} competitor stations discovered nearby`} />
          <div className="card-pad">
            <SiteMap sites={[site]} competitors={competitors} highlightSiteId={site.id} height={320} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Demand signals" subtitle={demand ? `As of ${demand.asOf}` : "Not available"} />
          <div className="card-pad space-y-3 text-sm">
            {demand ? (
              <>
                <SignalRow label="Composite demand" value={`${demand.demandMultiplier >= 1 ? "+" : ""}${Math.round((demand.demandMultiplier - 1) * 100)}% vs baseline`} tone={demand.demandMultiplier >= 1.15 ? "success" : demand.demandMultiplier <= 0.85 ? "warning" : "default"} />
                <SignalRow label="Weather" value={`${WEATHER_LABEL[demand.weather.condition]} · ${demand.weather.tempC}°C`} />
                <SignalRow label="Holiday" value={demand.isHoliday ? (demand.holidayName ?? "Yes") : "No"} />
                <SignalRow label="Local events" value={demand.localEvents.length ? demand.localEvents.map((e) => `${e.name} (${e.date})`).join(", ") : "None"} />
                <SignalRow label="Traffic index" value={formatPercent(demand.trafficIndex)} />
                <SignalRow label="Day type" value={demand.isWeekend ? "Weekend" : "Weekday"} />
                <p className="pt-1 text-xs text-muted">Mock signals — see <span className="font-mono">lib/demand-signals.ts</span> for the live-integration seam (weather, holidays, events, traffic).</p>
              </>
            ) : (
              <EmptyState title="No demand signals" />
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Hourly utilization" subtitle={utilization ? `7-day average · as of ${utilization.asOf}` : "Not available"} />
          <div className="card-pad">{utilization ? <UtilizationChart hourly={utilization.hourly} /> : <EmptyState title="No utilization data" />}</div>
        </Card>
        <Card>
          <CardHeader title="Utilization by weekday" subtitle="7-day average" />
          <div className="card-pad">{utilization ? <WeekdayBars weekday={utilization.weekday} /> : <EmptyState title="No utilization data" />}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Competitor benchmark" subtitle="Nearby charging stations and price gap vs. this site" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="px-5 py-3">Station</th>
                  <th className="px-5 py-3">Operator</th>
                  <th className="px-5 py-3">Distance</th>
                  <th className="px-5 py-3">Power</th>
                  <th className="px-5 py-3">Price / kWh</th>
                  <th className="px-5 py-3">Availability</th>
                  <th className="px-5 py-3">Gap vs us</th>
                  <th className="px-5 py-3">Source</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c) => {
                  const gapPct = c.pricePerKwh === null ? null : (site.currentPricePerKwh - c.pricePerKwh) / c.pricePerKwh;
                  return (
                    <tr key={c.id} className="table-row hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-ink">{c.name}</td>
                      <td className="px-5 py-3 text-muted">{c.operatorName}</td>
                      <td className="px-5 py-3 tabular-nums">{c.distanceKm} km</td>
                      <td className="px-5 py-3 tabular-nums">{c.maxPowerKw} kW</td>
                      <td className="px-5 py-3 tabular-nums">{formatPrice(c.pricePerKwh, c.currency)}</td>
                      <td className="px-5 py-3 tabular-nums">{c.availability === null ? <span className="text-slate-400">n/a</span> : formatPercent(c.availability)}</td>
                      <td className="px-5 py-3"><GapPill gapPct={gapPct} /></td>
                      <td className="px-5 py-3 text-xs text-slate-400">{c.source} · {relativeDate(c.lastSeenAt)}</td>
                    </tr>
                  );
                })}
                {competitors.length === 0 && (
                  <tr><td colSpan={8}><EmptyState title="No competitors discovered" hint="Connect OpenChargeMap or Google Places to populate this." /></td></tr>
                )}
              </tbody>
            </table>
          </div>
          {priceObservations.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-3 text-xs text-muted">
              {priceObservations.length} recent price observations on record · most recent {relativeDate(priceObservations[priceObservations.length - 1].observedAt)}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Price positioning" subtitle="This site vs. priced competitors" action={<PositionBadge position={benchmark.position} />} />
          <div className="card-pad">
            <PriceComparisonChart
              ourLabel={site.name}
              ourPrice={site.currentPricePerKwh}
              competitors={competitors.map((c) => ({ name: c.name, price: c.pricePerKwh }))}
              currency={site.currency}
            />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-ink">Recommendations for this site</h2>
          {recommendations.length === 0 ? (
            <Card className="card-pad"><EmptyState title="No recommendations" hint="The pricing engine has nothing to flag for this site right now." /></Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {recommendations.map((r) => (
                <RecommendationCard key={r.id} rec={r} />
              ))}
            </div>
          )}
        </div>
        <Card>
          <CardHeader title="Site alerts" subtitle={`${alerts.filter((a) => !a.read).length} unread`} />
          <div className="card-pad">
            <AlertsPanel alerts={alerts} showSite={false} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function SignalRow({ label, value, tone }: { label: string; value: string; tone?: "default" | "success" | "warning" }) {
  const cls = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-ink";
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className={"text-right font-medium " + cls}>{value}</span>
    </div>
  );
}
