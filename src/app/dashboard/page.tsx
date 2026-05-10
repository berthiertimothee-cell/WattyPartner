import Link from "next/link";
import {
  getDashboardMetrics,
  getDeployments,
  getNotifications,
  getPartners,
  getRecentActivity,
  getSiteSummary,
  getSites,
  isIncidentOpen,
  getIncidents,
} from "@/lib/data";
import { Card, CardHeader, KpiTile, LinkButton, ProgressBar, SectionTitle } from "@/components/ui";
import { AreaTrendChart, BarSeriesChart } from "@/components/Charts";
import { AiSummaryCard } from "@/components/AiSummaryCard";
import { AlertsList } from "@/components/AlertsList";
import { ActivityFeed } from "@/components/ActivityFeed";
import { DeploymentStatusBadge, SiteStatusBadge } from "@/components/StatusBadge";
import { ArrowUpRight, BellIcon, BoltIcon, CoinIcon, PinIcon, TruckIcon, UsersIcon, WrenchIcon } from "@/components/Icons";
import { formatKwh, formatMoney, formatMoneyCompact, formatNumber, formatPercent, formatSignedPercent } from "@/lib/utils";

export default function DashboardPage() {
  const m = getDashboardMetrics();
  const partners = getPartners();
  const partnerNameById = new Map(partners.map((p) => [p.id, p.name]));
  const sites = getSites();
  const liveSites = sites.filter((s) => s.monthly.length);
  const attention = liveSites
    .map((s) => ({ s, open: getIncidents({ siteId: s.id, openOnly: true }).length }))
    .filter((x) => x.s.uptimePct < 0.96 || x.open > 0 || x.s.status === "maintenance")
    .sort((a, b) => a.s.uptimePct - b.s.uptimePct)
    .slice(0, 5);
  const deployments = getDeployments();
  const alerts = getNotifications().slice(0, 5);
  const activity = getRecentActivity(8);
  const spotlightSummary = getSiteSummary("site_stmalo_port");

  const chart = m.monthly.map((x) => ({ month: x.month, revenueEur: x.revenueEur, sessions: x.sessions, uptimePct: +(x.uptimePct * 100).toFixed(1) }));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Network overview across {m.partnersCount} partners · {m.totalSitesCount} sites · last full month {chart.length ? labelMonth(chart[chart.length - 1].month) : "—"}.</p>
        </div>
        <div className="flex items-center gap-2">
          <LinkButton href="/reports" variant="secondary">
            <ArrowUpRight className="h-4 w-4" /> Generate report
          </LinkButton>
          <LinkButton href="/incidents" variant="primary">
            <WrenchIcon className="h-4 w-4" /> Incidents
          </LinkButton>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Revenue (last month)" value={formatMoneyCompact(m.revenue.value)} delta={m.revenue.delta} icon={<CoinIcon className="h-5 w-5" />} sub={`${formatMoney(m.revenue.value)} across the network`} />
        <KpiTile label="Charging sessions" value={formatNumber(m.sessions.value)} delta={m.sessions.delta} icon={<BoltIcon className="h-5 w-5" />} sub={`${formatKwh(m.energyKwh.value)} delivered`} />
        <KpiTile label="Network uptime" value={formatPercent(m.uptime.value, 1)} delta={m.uptime.delta} icon={<PinIcon className="h-5 w-5" />} sub={`${m.activeChargersCount} of ${m.totalChargersCount} chargers available`} />
        <KpiTile label="Est. royalties (this month)" value={formatMoneyCompact(m.estimatedRoyaltiesThisMonth)} icon={<CoinIcon className="h-5 w-5" />} sub="Across all partner revenue shares" href="/revenues" />
      </div>

      {/* Secondary KPIs */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile label="Partners" value={formatNumber(m.partnersCount)} icon={<UsersIcon className="h-5 w-5" />} sub={`${partners.filter((p) => p.status === "onboarding").length} onboarding`} href="/partners" />
        <KpiTile label="Active sites" value={`${m.activeSitesCount}/${m.totalSitesCount}`} icon={<PinIcon className="h-5 w-5" />} sub={`${sites.filter((s) => s.status === "construction" || s.status === "planned").length} in deployment`} href="/sites" />
        <KpiTile label="Open incidents" value={formatNumber(m.openIncidentsCount)} icon={<WrenchIcon className="h-5 w-5" />} sub={`${m.slaAtRiskCount} at SLA risk`} href="/incidents" deltaInvert />
        <KpiTile label="Active deployments" value={formatNumber(m.activeDeploymentsCount)} icon={<TruckIcon className="h-5 w-5" />} sub={`${m.delayedDeploymentsCount} delayed`} href="/deployments" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Network revenue" subtitle="Monthly charging revenue across all live sites" icon={<CoinIcon className="h-5 w-5" />} action={<span className="badge bg-emerald-50 text-success">{formatSignedPercent(m.revenue.delta, 1)} MoM</span>} />
            <div className="card-pad pt-2">
              <AreaTrendChart data={chart} xKey="month" yKey="revenueEur" label="Revenue" color="#1E4ED8" format="moneyCompact" height={220} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Charging sessions" subtitle="Monthly sessions across the network" icon={<BoltIcon className="h-5 w-5" />} action={<span className="badge bg-emerald-50 text-success">{formatSignedPercent(m.sessions.delta, 1)} MoM</span>} />
            <div className="card-pad pt-2">
              <BarSeriesChart data={chart} xKey="month" yKey="sessions" label="Sessions" color="#0B1F4D" format="number" height={200} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Sites needing attention" subtitle="Low uptime, open incidents or in maintenance" icon={<PinIcon className="h-5 w-5" />} action={<Link href="/sites" className="text-xs font-medium text-brand-600">All sites →</Link>} />
            <div className="divide-y divide-slate-100">
              {attention.length === 0 && <p className="px-6 py-8 text-center text-sm text-muted">Every live site is healthy.</p>}
              {attention.map(({ s, open }) => (
                <Link key={s.id} href={`/sites/${s.id}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50 sm:px-6">
                  <span className="h-9 w-9 shrink-0 rounded-lg" style={{ background: `linear-gradient(135deg, ${s.photoColor}, ${s.photoColor}aa)` }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{s.name}</p>
                    <p className="text-xs text-muted">{partnerNameById.get(s.partnerId)} · {s.city}</p>
                  </div>
                  <div className="hidden w-28 sm:block">
                    <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
                      <span>Uptime</span>
                      <span className="tabular-nums">{formatPercent(s.uptimePct, 1)}</span>
                    </div>
                    <ProgressBar value={s.uptimePct} tone={s.uptimePct < 0.95 ? "amber" : "blue"} />
                  </div>
                  <div className="flex w-24 shrink-0 items-center justify-end gap-2">
                    {open > 0 && <span className="badge bg-amber-50 text-warning">{open} open</span>}
                    <SiteStatusBadge status={s.status} />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {spotlightSummary && <AiSummaryCard summary={spotlightSummary} compact />}
          <Card>
            <CardHeader title="Alerts" subtitle="Highest-priority items" icon={<BellIcon className="h-5 w-5" />} action={<Link href="/alerts" className="text-xs font-medium text-brand-600">All →</Link>} />
            <AlertsList items={alerts} partnerNameById={partnerNameById} />
          </Card>
          <Card>
            <CardHeader title="Active deployments" icon={<TruckIcon className="h-5 w-5" />} action={<Link href="/deployments" className="text-xs font-medium text-brand-600">All →</Link>} />
            <div className="divide-y divide-slate-100">
              {deployments.slice(0, 4).map((d) => (
                <Link key={d.id} href={`/deployments/${d.id}`} className="block px-5 py-3.5 transition-colors hover:bg-slate-50 sm:px-6">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-ink">{d.name}</p>
                    <DeploymentStatusBadge deployment={d} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{partnerNameById.get(d.partnerId)} · go-live {labelMonth(d.expectedGoLive)}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <ProgressBar value={d.progress} tone={d.delayed ? "amber" : "blue"} className="flex-1" />
                    <span className="text-xs font-medium tabular-nums text-ink">{Math.round(d.progress * 100)}%</span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Recent activity" />
            <ActivityFeed items={activity} partnerNameById={partnerNameById} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function labelMonth(key: string) {
  const iso = /^\d{4}-\d{2}$/.test(key) ? `${key}-01T00:00:00Z` : key;
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}
