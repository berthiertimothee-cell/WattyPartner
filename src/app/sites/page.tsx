import Link from "next/link";
import { getBenchmark, getIncidents, getPartners, getSites } from "@/lib/data";
import { PageHeader, ActionButton } from "@/components/ui";
import { PositionBadge, SiteStatusBadge } from "@/components/StatusBadge";
import { BoltIcon, PlusIcon } from "@/components/Icons";
import { formatMoney, formatNumber, formatPercent } from "@/lib/utils";
import { DataTable, DensityToggle, FilterBar, SavedView, type DataTableColumn } from "@/components/DataTable";
import type { Site } from "@/lib/types";

type SiteRow = Site & { partnerName: string; openIncidents: number; health: number; position?: React.ReactNode };

export default function SitesPage() {
  const sites = getSites();
  const partnerNameById = new Map(getPartners().map((p) => [p.id, p.name]));
  const active = sites.filter((s) => s.status === "active").length;
  const openIncidentsBySite = new Map(sites.map((s) => [s.id, getIncidents({ siteId: s.id, openOnly: true }).length]));
  const totalOpen = Array.from(openIncidentsBySite.values()).reduce((a, b) => a + b, 0);

  const rows: SiteRow[] = sites.map((s) => {
    const open = openIncidentsBySite.get(s.id) ?? 0;
    const b = getBenchmark(s.id);
    return {
      ...s,
      partnerName: partnerNameById.get(s.partnerId) ?? "—",
      openIncidents: open,
      health: Math.max(42, Math.min(99, Math.round((s.uptimePct || 90) - open * 8 + (s.monthly.length ? 4 : -10)))),
      position: b ? <PositionBadge position={b.position} /> : <span className="text-xs text-slate-400">—</span>,
    };
  });

  const columns: DataTableColumn<SiteRow>[] = [
    {
      key: "site",
      header: "Site",
      sticky: true,
      render: (s) => <div><Link href={`/sites/${s.id}`} className="font-bold text-ink hover:text-brand-600">{s.name}</Link><div className="text-xs text-muted">{s.city} · <BoltIcon className="inline h-3 w-3" /> {s.chargerCount} · {s.totalPowerKw} kW</div></div>,
    },
    { key: "partner", header: "Partner", render: (s) => <span className="text-muted">{s.partnerName}</span> },
    { key: "health", header: "Health", render: (s) => <Health value={s.health} />, align: "center" },
    { key: "status", header: "Status", render: (s) => <SiteStatusBadge status={s.status} />, align: "center" },
    { key: "revenue", header: "Revenue", render: (s) => <span className="font-semibold tabular-nums">{s.monthly.length ? formatMoney(s.revenuePerMonthEur) : "—"}</span>, align: "right" },
    { key: "sessions", header: "Sessions", render: (s) => <span className="tabular-nums">{s.monthly.length ? formatNumber(s.sessionsPerDay) : "—"}/d</span>, align: "right" },
    { key: "uptime", header: "Uptime", render: (s) => <span className="tabular-nums">{s.monthly.length ? formatPercent(s.uptimePct, 1) : "—"}</span>, align: "right" },
    { key: "position", header: "Position", render: (s) => s.position, align: "center" },
    { key: "action", header: "Next action", render: (s) => s.openIncidents > 0 ? <Link href={`/sites/${s.id}`} className="badge bg-amber-50 text-warning">Resolve {s.openIncidents}</Link> : <Link href={`/sites/${s.id}`} className="text-xs font-bold text-brand-600">Review</Link> },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Sites" subtitle="Portfolio cockpit for CSMs managing high-volume partner networks." actions={<ActionButton variant="primary"><PlusIcon className="h-4 w-4" /> Add site</ActionButton>} />

      <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
        <div className="card card-pad">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-sm font-bold text-ink">Saved views</p><p className="text-xs text-muted">Switch instantly between operational priorities.</p></div>
            <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Save current view</button>
          </div>
          <div className="grid gap-2 md:grid-cols-4">
            <SavedView label="All sites" count={sites.length} active />
            <SavedView label="Incidents" count={totalOpen} />
            <SavedView label="Low uptime" count={sites.filter((s) => s.uptimePct < 95).length} />
            <SavedView label="Deployment" count={sites.filter((s) => s.status !== "active").length} />
          </div>
        </div>

        <div className="card card-pad">
          <div className="grid grid-cols-2 gap-2">
            <Kpi label="Total" value={`${sites.length}`} />
            <Kpi label="Active" value={`${active}`} />
            <Kpi label="Incidents" value={`${totalOpen}`} />
            <Kpi label="Chargers" value={`${sites.reduce((n, s) => n + s.chargerCount, 0)}`} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button className="rounded-xl bg-ink px-3 py-2 text-xs font-bold text-white">Bulk email</button>
          <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">Create task</button>
          <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">Export CSV</button>
          <div className="ml-auto flex items-center gap-2"><DensityToggle density="comfortable" /><span className="text-xs font-medium text-muted">Showing {sites.length} sites</span></div>
        </div>

        <FilterBar searchPlaceholder="Search site, partner, city...">
          <select className="input max-w-[150px]"><option>Status</option></select>
          <select className="input max-w-[170px]"><option>Partner</option></select>
          <select className="input max-w-[170px]"><option>Health score</option></select>
          <select className="input max-w-[180px]"><option>Sort: priority</option></select>
        </FilterBar>

        <DataTable rows={rows} columns={columns} density="comfortable" getRowKey={(row) => row.id} />
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 px-3 py-2"><div className="stat-label">{label}</div><div className="mt-1 text-xl font-black tabular-nums text-ink">{value}</div></div>; }
function Health({ value }: { value: number }) { const good = value >= 85; const mid = value >= 70; return <div className="flex items-center justify-center gap-2"><span className={good ? "h-2.5 w-2.5 rounded-full bg-success" : mid ? "h-2.5 w-2.5 rounded-full bg-warning" : "h-2.5 w-2.5 rounded-full bg-danger"} /><span className="font-bold tabular-nums text-ink">{value}</span><span className="text-xs text-muted">/100</span></div>; }
