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
  const totalOpen = Array.from(openIncidentsBySite.values()).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Sites" subtitle="Portfolio cockpit for CSMs managing high-volume partner networks." actions={<ActionButton variant="primary"><PlusIcon className="h-4 w-4" /> Add site</ActionButton>} />

      <div className="grid gap-3 xl:grid-cols-[1fr_360px]">
        <div className="card card-pad">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-ink">Saved views</p>
              <p className="text-xs text-muted">Switch instantly between operational priorities.</p>
            </div>
            <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Save current view</button>
          </div>
          <div className="grid gap-2 md:grid-cols-4">
            <View label="All sites" value={sites.length} active />
            <View label="Incidents" value={totalOpen} tone="warning" />
            <View label="Low uptime" value={sites.filter((s) => s.uptimePct < 95).length} />
            <View label="Deployment" value={sites.filter((s) => s.status !== "active").length} />
          </div>
        </div>

        <div className="card card-pad bg-watty-gradient-soft">
          <div className="grid grid-cols-2 gap-2">
            <Kpi label="Total" value={`${sites.length}`} />
            <Kpi label="Active" value={`${active}`} />
            <Kpi label="Incidents" value={`${totalOpen}`} />
            <Kpi label="Chargers" value={`${sites.reduce((n, s) => n + s.chargerCount, 0)}`} />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 bg-white/80 px-4 py-3">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button className="rounded-xl bg-ink px-3 py-2 text-xs font-bold text-white">Bulk email</button>
            <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">Create task</button>
            <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">Export CSV</button>
            <span className="ml-auto text-xs font-medium text-muted">0 selected · Showing {sites.length} sites</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-[280px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400"><PinIcon className="h-4 w-4" />Search site, partner, city...</div>
            <select className="input max-w-[150px]"><option>Status</option></select>
            <select className="input max-w-[170px]"><option>Partner</option></select>
            <select className="input max-w-[170px]"><option>Health score</option></select>
            <select className="input max-w-[180px]"><option>Sort: priority</option></select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
              <tr>
                <th className="w-10 px-4 py-3"><input type="checkbox" /></th>
                <th className="px-4 py-3">Site</th>
                <th className="px-4 py-3">Partner</th>
                <th className="px-4 py-3">Health</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Sessions</th>
                <th className="px-4 py-3">Uptime</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Next best action</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((s) => {
                const b = getBenchmark(s.id);
                const open = openIncidentsBySite.get(s.id) ?? 0;
                const health = Math.max(42, Math.min(99, Math.round((s.uptimePct || 90) - open * 8 + (s.monthly.length ? 4 : -10))));
                return (
                  <tr key={s.id} className="table-row hover:bg-slate-50/90">
                    <td className="px-4 py-3"><input type="checkbox" /></td>
                    <td className="sticky left-0 bg-white/95 px-4 py-3 backdrop-blur">
                      <Link href={`/sites/${s.id}`} className="font-bold text-ink hover:text-brand-600">{s.name}</Link>
                      <div className="text-xs text-muted">{s.city} · <BoltIcon className="inline h-3 w-3" /> {s.chargerCount} · {s.totalPowerKw} kW</div>
                    </td>
                    <td className="px-4 py-3 text-muted">{partnerNameById.get(s.partnerId)}</td>
                    <td className="px-4 py-3"><Health value={health} /></td>
                    <td className="px-4 py-3"><SiteStatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 tabular-nums font-semibold">{s.monthly.length ? formatMoney(s.revenuePerMonthEur) : "—"}</td>
                    <td className="px-4 py-3 tabular-nums">{s.monthly.length ? formatNumber(s.sessionsPerDay) : "—"}/d</td>
                    <td className="px-4 py-3 tabular-nums">{s.monthly.length ? formatPercent(s.uptimePct, 1) : "—"}</td>
                    <td className="px-4 py-3">{b ? <PositionBadge position={b.position} /> : <span className="text-xs text-slate-400">—</span>}</td>
                    <td className="px-4 py-3">{open > 0 ? <Link href={`/sites/${s.id}`} className="badge bg-amber-50 text-warning">Resolve {open} incident{open > 1 ? "s" : ""}</Link> : <Link href={`/sites/${s.id}`} className="text-xs font-bold text-brand-600">Review performance</Link>}</td>
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
function Kpi({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-white/80 px-3 py-2"><div className="stat-label">{label}</div><div className="mt-1 text-xl font-black tabular-nums text-ink">{value}</div></div>; }
function View({ label, value, active, tone }: { label: string; value: number; active?: boolean; tone?: "warning" }) { return <button className={active ? "rounded-2xl bg-watty-gradient p-4 text-left text-white shadow-glow" : "rounded-2xl border border-slate-200 bg-white p-4 text-left hover:shadow-cardHover"}><div className="text-xs font-bold uppercase tracking-wide opacity-70">{label}</div><div className={tone === "warning" ? "mt-1 text-2xl font-black text-warning" : "mt-1 text-2xl font-black"}>{value}</div></button>; }
function Health({ value }: { value: number }) { const good = value >= 85; const mid = value >= 70; return <div className="flex items-center gap-2"><span className={good ? "h-2.5 w-2.5 rounded-full bg-success" : mid ? "h-2.5 w-2.5 rounded-full bg-warning" : "h-2.5 w-2.5 rounded-full bg-danger"} /><span className="font-bold tabular-nums text-ink">{value}</span><span className="text-xs text-muted">/100</span></div>; }
