import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBenchmark,
  getChargersBySite,
  getDeploymentForSite,
  getDocuments,
  getIncidents,
  getPartner,
  getSite,
  getSiteSummary,
} from "@/lib/data";
import { PageHeader, Card, CardHeader, KpiTile, ActionButton, PhotoPlaceholder, KeyValue, ProgressBar } from "@/components/ui";
import { AreaTrendChart, BarSeriesChart, HBarCompareChart, LineTrendChart } from "@/components/Charts";
import { AiSummaryCard } from "@/components/AiSummaryCard";
import { ChargerStatusBadge, IncidentStatusBadge, PositionBadge, SiteStatusBadge } from "@/components/StatusBadge";
import { Timeline } from "@/components/Timeline";
import { BoltIcon, ChartIcon, CoinIcon, DocIcon, DownloadIcon, LeafIcon, MailIcon, PinIcon, TruckIcon, WrenchIcon } from "@/components/Icons";
import { formatDate, formatMoney, formatMoneyCompact, formatNumber, formatPercent, formatPrice, formatMonth, titleCase } from "@/lib/utils";
import type { ElectricitySource } from "@/lib/types";

const ELEC_LABEL: Record<ElectricitySource, string> = { grid: "Grid electricity", grid_green: "Grid — green tariff", solar_hybrid: "Solar + grid hybrid" };

export default function SiteDetailPage({ params }: { params: { id: string } }) {
  const site = getSite(params.id);
  if (!site) notFound();
  const partner = getPartner(site.partnerId);
  const chargers = getChargersBySite(site.id);
  const incidents = getIncidents({ siteId: site.id });
  const openIncidents = incidents.filter((i) => i.status !== "resolved");
  const benchmark = getBenchmark(site.id);
  const deployment = getDeploymentForSite(site.id);
  const documents = getDocuments({ siteId: site.id });
  const summary = getSiteSummary(site.id);
  const activeChargers = chargers.filter((c) => c.status === "available" || c.status === "charging").length;
  const m = site.monthly.length ? site.monthly[site.monthly.length - 1] : null;

  const revChart = site.monthly.map((x) => ({ month: x.month, revenueEur: x.revenueEur, sessions: x.sessions }));
  const upChart = site.monthly.map((x) => ({ month: x.month, uptime: +(x.uptimePct * 100).toFixed(2) }));

  return (
    <div>
      <PageHeader
        title={site.name}
        breadcrumb={[{ label: "Sites", href: "/sites" }, { label: site.name, href: `/sites/${site.id}` }]}
        subtitle={`${site.address} · ${site.lat.toFixed(4)}, ${site.lng.toFixed(4)}`}
        actions={
          <>
            <ActionButton href="/partners" variant="secondary"><MailIcon className="h-4 w-4" /> Email partner</ActionButton>
            <ActionButton href="/reports/monthly-partner-report-sample.pdf" variant="primary"><DownloadIcon className="h-4 w-4" /> Site report</ActionButton>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SiteStatusBadge status={site.status} />
        {partner && (
          <Link href={`/partners/${partner.id}`} className="pill hover:bg-slate-50">
            Partner: {partner.name}
          </Link>
        )}
        <span className="pill"><BoltIcon className="h-4 w-4 text-slate-400" /> {site.chargerCount} chargers · {site.totalPowerKw} kW</span>
        {(site.electricitySource === "grid_green" || site.electricitySource === "solar_hybrid") && <span className="pill !text-success"><LeafIcon className="h-4 w-4" /> {ELEC_LABEL[site.electricitySource]}</span>}
        {openIncidents.length > 0 && <span className="pill !border-amber-200 !text-warning"><WrenchIcon className="h-4 w-4" /> {openIncidents.length} open incident{openIncidents.length === 1 ? "" : "s"}</span>}
      </div>

      {/* Hero + facts */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PhotoPlaceholder color={site.photoColor} label={`${site.city}, ${site.region}`} height={260} />
        </div>
        <Card className="card-pad">
          <h2 className="section-title mb-3">Site details</h2>
          <dl>
            <KeyValue label="Address">{site.address}</KeyValue>
            <KeyValue label="Coordinates">{site.lat.toFixed(4)}, {site.lng.toFixed(4)}</KeyValue>
            <KeyValue label="O&M operator">{site.operatorName}</KeyValue>
            <KeyValue label="Electricity">{ELEC_LABEL[site.electricitySource]}</KeyValue>
            <KeyValue label="Commissioned">{site.commissionedAt ? formatDate(site.commissionedAt) : site.expectedGoLive ? `Expected ${formatMonth(site.expectedGoLive)}` : "—"}</KeyValue>
            <KeyValue label="Chargers">{site.chargerCount} · {site.totalPowerKw} kW total</KeyValue>
            {benchmark && <KeyValue label="Local market share">~{formatPercent(benchmark.marketSharePct)}</KeyValue>}
          </dl>
        </Card>
      </div>

      {m ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiTile label="Revenue (last month)" value={formatMoneyCompact(m.revenueEur)} icon={<CoinIcon className="h-5 w-5" />} sub={`${formatPrice(m.avgPriceEurKwh)}/kWh avg`} />
            <KpiTile label="Sessions / day" value={formatNumber(site.sessionsPerDay)} icon={<BoltIcon className="h-5 w-5" />} sub={`${formatNumber(m.sessions)} this month`} />
            <KpiTile label="Uptime" value={formatPercent(site.uptimePct, 1)} icon={<PinIcon className="h-5 w-5" />} sub={site.uptimePct < 0.95 ? "Below 95% target" : "Healthy"} />
            <KpiTile label="Chargers available" value={`${activeChargers}/${site.chargerCount}`} icon={<BoltIcon className="h-5 w-5" />} sub={`${chargers.filter((c) => c.status === "faulted" || c.status === "offline").length} faulted/offline`} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader title="Revenue & sessions" subtitle="Monthly trend" icon={<ChartIcon className="h-5 w-5" />} />
                <div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2">
                  <div className="card-pad">
                    <p className="stat-label mb-1">Revenue (€/month)</p>
                    <AreaTrendChart data={revChart} xKey="month" yKey="revenueEur" format="moneyCompact" height={170} />
                  </div>
                  <div className="card-pad">
                    <p className="stat-label mb-1">Sessions / month</p>
                    <BarSeriesChart data={revChart} xKey="month" yKey="sessions" color="#0B1F4D" format="number" height={170} />
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader title="Uptime" subtitle="Monthly availability, %" icon={<PinIcon className="h-5 w-5" />} />
                <div className="card-pad pt-2">
                  <LineTrendChart data={upChart} xKey="month" yKey="uptime" domain={[80, 100]} format="percent" height={170} />
                </div>
              </Card>

              <Card>
                <CardHeader title="Chargers" subtitle={`${chargers.length} units`} icon={<BoltIcon className="h-5 w-5" />} />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="px-5 py-2.5 sm:px-6">Unit</th>
                        <th className="px-3 py-2.5">Vendor / model</th>
                        <th className="px-3 py-2.5">Power</th>
                        <th className="px-3 py-2.5">Type</th>
                        <th className="px-3 py-2.5">Commissioned</th>
                        <th className="px-5 py-2.5 text-right sm:px-6">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chargers.map((c) => (
                        <tr key={c.id} className="table-row">
                          <td className="px-5 py-2.5 font-medium text-ink sm:px-6">{c.id.split("_").pop()}</td>
                          <td className="px-3 py-2.5 text-slate-600">{c.vendor} {c.model}</td>
                          <td className="px-3 py-2.5 tabular-nums text-slate-600">{c.powerKw} kW</td>
                          <td className="px-3 py-2.5 text-slate-600">{c.type} · {c.connectors} conn.</td>
                          <td className="px-3 py-2.5 text-slate-600">{formatDate(c.commissionedAt)}</td>
                          <td className="px-5 py-2.5 text-right sm:px-6"><ChargerStatusBadge status={c.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {benchmark && (
                <Card>
                  <CardHeader
                    title="Competitor benchmark"
                    subtitle={`${benchmark.competitors.length} networks within ~5 km · est. local market share ~${formatPercent(benchmark.marketSharePct)}`}
                    icon={<ChartIcon className="h-5 w-5" />}
                    action={<PositionBadge position={benchmark.position} />}
                  />
                  <div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2">
                    <div className="card-pad">
                      <p className="stat-label mb-1">Price (€/kWh)</p>
                      <HBarCompareChart
                        data={[{ label: "Us", value: benchmark.ourPriceEurKwh, highlight: true }, ...benchmark.competitors.map((c) => ({ label: c.brand, value: c.priceEurKwh }))]}
                        format="eurkwh"
                        height={Math.max(150, (benchmark.competitors.length + 1) * 34)}
                      />
                    </div>
                    <div className="card-pad">
                      <p className="stat-label mb-1">Max power (kW)</p>
                      <HBarCompareChart
                        data={[{ label: "Us", value: benchmark.ourMaxPowerKw, highlight: true }, ...benchmark.competitors.map((c) => ({ label: c.brand, value: c.maxPowerKw }))]}
                        format="kw"
                        height={Math.max(150, (benchmark.competitors.length + 1) * 34)}
                      />
                    </div>
                  </div>
                  <div className="card-pad pt-0">
                    <p className="stat-label mb-2">Estimated utilization vs nearby</p>
                    <div className="space-y-2">
                      <UtilBar label={`${partner?.name ?? "Our site"} (us)`} value={benchmark.ourUtilizationPct} highlight />
                      {benchmark.competitors.map((c) => (
                        <UtilBar key={c.brand} label={`${c.brand} · ${c.distanceKm} km`} value={c.estimatedUtilizationPct} />
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              <Card>
                <CardHeader title="Maintenance history" subtitle={`${incidents.length} incident${incidents.length === 1 ? "" : "s"} logged`} icon={<WrenchIcon className="h-5 w-5" />} action={<Link href="/incidents" className="text-xs font-medium text-brand-600">All incidents →</Link>} />
                <div className="divide-y divide-slate-100">
                  {incidents.length === 0 && <p className="px-6 py-8 text-center text-sm text-muted">No incidents on record.</p>}
                  {incidents.map((i) => (
                    <Link key={i.id} href={`/incidents/${i.id}`} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50 sm:px-6">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{i.title}</p>
                        <p className="text-xs text-muted">{titleCase(i.category)} · opened {formatDate(i.openedAt)}{i.resolvedAt ? ` · resolved ${formatDate(i.resolvedAt)}` : i.etaAt ? ` · ETA ${formatDate(i.etaAt)}` : ""}</p>
                      </div>
                      <IncidentStatusBadge status={i.status} />
                    </Link>
                  ))}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              {summary && <AiSummaryCard summary={summary} />}
              {openIncidents[0] && (
                <Card>
                  <CardHeader title="Open incident timeline" subtitle={openIncidents[0].title} icon={<WrenchIcon className="h-5 w-5" />} />
                  <div className="card-pad">
                    <Timeline events={openIncidents[0].timeline} />
                  </div>
                </Card>
              )}
              {documents.length > 0 && (
                <Card>
                  <CardHeader title="Site documents" icon={<DocIcon className="h-5 w-5" />} />
                  <ul className="divide-y divide-slate-100">
                    {documents.map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-2.5 sm:px-6">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-ink">{d.name}</p>
                          <p className="text-[11px] text-muted">{titleCase(d.kind)} · {formatDate(d.uploadedAt)}</p>
                        </div>
                        <DownloadIcon className="h-4 w-4 shrink-0 text-slate-300" />
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          </div>
        </>
      ) : (
        <Card className="card-pad">
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-brand-600"><TruckIcon className="h-5 w-5" /></span>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-ink">This site isn’t live yet</h2>
              <p className="mt-1 text-sm text-muted">It’s currently <strong>{titleCase(site.status)}</strong>{site.expectedGoLive ? `, with an expected go-live in ${formatMonth(site.expectedGoLive)}` : ""}. Performance metrics will appear here once the site is commissioned.</p>
              {deployment && (
                <Link href={`/deployments/${deployment.id}`} className="btn-secondary mt-3 inline-flex">
                  View deployment timeline
                </Link>
              )}
            </div>
          </div>
          {deployment && (
            <div className="mt-5">
              <div className="mb-1 flex items-center justify-between text-xs text-muted"><span>Deployment progress</span><span className="tabular-nums">{Math.round(deployment.progress * 100)}%</span></div>
              <ProgressBar value={deployment.progress} tone={deployment.delayed ? "amber" : "blue"} />
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function UtilBar({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-44 shrink-0 truncate text-xs text-slate-600">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={highlight ? "h-full rounded-full bg-brand" : "h-full rounded-full bg-slate-300"} style={{ width: `${Math.min(100, value * 200)}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums text-ink">{formatPercent(value, 0)}</span>
    </div>
  );
}
