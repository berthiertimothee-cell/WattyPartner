import Link from "next/link";
import { getBenchmark, getIncidents, getPartners, getSites } from "@/lib/data";
import { PageHeader, ActionButton } from "@/components/ui";
import { PositionBadge, SiteStatusBadge } from "@/components/StatusBadge";
import { BoltIcon, PinIcon, PlusIcon } from "@/components/Icons";
import { formatMoney, formatNumber, formatPercent } from "@/lib/utils";

export default function SitesPage() {
  const sites = getSites();
  const partnerNameById = new Map(getPartners().map((p) => [p.id, p.name]));
  const active = sites.filter((s) => s.status === "active").length;
  const openIncidentsBySite = new Map(sites.map((s) => [s.id, getIncidents({ siteId: s.id, openOnly: true }).length]));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sites"
        subtitle="Operational list designed for fast follow-up across large partner portfolios."
        actions={<ActionButton variant="primary"><PlusIcon className="h-4 w-4" /> Add site</ActionButton>}
      />

      <div className="card card-pad">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="grid gap-2 sm:grid-cols-4">
            <Kpi label="Total" value={`${sites.length}`} />
            <Kpi label="Active" value={`${active}`} />
            <Kpi label="Open incidents" value={`${Array.from(openIncidentsBySite.values()).reduce((a, b) => a + b, 0)}`} />
            <Kpi label="Chargers" value={`${sites.reduce((n, s) => n + s.chargerCount, 0)}`} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Filter label="All sites" active />
            <Filter label="Active" />
            <Filter label="Incidents" />
            <Filter label="Deployment" />
            <Filter label="Needs review" />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400">
              <PinIcon className="h-4 w-4" />
              <span>Search site, partner, city...</span>
            </div>
            <select className="input max-w-[170px]"><option>Status</option></select>
            <select className="input max-w-[180px]"><option>Partner</option></select>
            <select className="input max-w-[180px]"><option>Sort by revenue</option></select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="px-4 py-3">Site</th>
                <th className="px-4 py-3">Partner</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Power</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Sessions</th>
                <th className="px-4 py-3">Uptime</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((s) => {
                const b = getBenchmark(s.id);
                const open = openIncidentsBySite.get(s.id) ?? 0;
                return (
                  <tr key={s.id} className="table-row hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <Link href={`/sites/${s.id}`} className="font-semibold text-ink hover:text-brand-600">{s.name}</Link>
                      <div className="text-xs text-muted">{s.city}</div>
                    </td>
                    <td className="px-4 py-3 text-muted">{partnerNameById.get(s.partnerId)}</td>
                    <td className="px-4 py-3"><SiteStatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 tabular-nums"><BoltIcon className="mr-1 inline h-3.5 w-3.5 text-slate-400" />{s.chargerCount} · {s.totalPowerKw} kW</td>
                    <td className="px-4 py-3 tabular-nums font-medium">{s.monthly.length ? formatMoney(s.revenuePerMonthEur) : "—"}</td>
                    <td className="px-4 py-3 tabular-nums">{s.monthly.length ? formatNumber(s.sessionsPerDay) : "—"}/day</td>
                    <td className="px-4 py-3 tabular-nums">{s.monthly.length ? formatPercent(s.uptimePct, 1) : "—"}</td>
                    <td className="px-4 py-3">{b ? <PositionBadge position={b.position} /> : <span className="text-xs text-slate-400">—</span>}</td>
                    <td className="px-4 py-3">
                      {open > 0 ? <Link href={`/sites/${s.id}`} className="badge bg-amber-50 text-warning">{open} open</Link> : <Link href={`/sites/${s.id}`} className="text-xs font-semibold text-brand-600">Review</Link>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 px-3 py-2"><div className="stat-label">{label}</div><div className="mt-1 text-lg font-bold tabular-nums text-ink">{value}</div></div>;
}
function Filter({ label, active }: { label: string; active?: boolean }) {
  return <button className={active ? "rounded-xl bg-watty-gradient px-3 py-2 text-xs font-bold text-white" : "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"}>{label}</button>;
}
