import Link from "next/link";
import { getBenchmark, getIncidents, getPartners, getSites } from "@/lib/data";
import { PageHeader, Card, ActionButton, PhotoPlaceholder } from "@/components/ui";
import { PositionBadge, SiteStatusBadge } from "@/components/StatusBadge";
import { BoltIcon, LeafIcon, PinIcon, PlusIcon } from "@/components/Icons";
import { formatMoney, formatNumber, formatPercent, titleCase } from "@/lib/utils";
import type { ElectricitySource } from "@/lib/types";

const ELEC_LABEL: Record<ElectricitySource, string> = { grid: "Grid", grid_green: "Grid (green)", solar_hybrid: "Solar hybrid" };

export default function SitesPage() {
  const sites = getSites();
  const partnerNameById = new Map(getPartners().map((p) => [p.id, p.name]));
  const live = sites.filter((s) => s.monthly.length);
  const totalRevenue = live.reduce((n, s) => n + s.revenuePerMonthEur, 0);
  const totalChargers = sites.reduce((n, s) => n + s.chargerCount, 0);

  return (
    <div>
      <PageHeader
        title="Sites"
        subtitle="Every charging location across the network — performance, status, power and competitor positioning."
        actions={
          <ActionButton variant="primary">
            <PlusIcon className="h-4 w-4" /> Add site
          </ActionButton>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="pill"><PinIcon className="h-4 w-4 text-slate-400" /> {sites.length} sites · {sites.filter((s) => s.status === "active").length} active</span>
        <span className="pill"><BoltIcon className="h-4 w-4 text-slate-400" /> {totalChargers} chargers</span>
        <span className="pill">{formatMoney(totalRevenue)}/mo combined</span>
        <span className="pill">{sites.filter((s) => s.status === "construction" || s.status === "planned").length} in deployment</span>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {sites.map((s) => {
          const b = getBenchmark(s.id);
          const open = getIncidents({ siteId: s.id, openOnly: true }).length;
          return (
            <Link key={s.id} href={`/sites/${s.id}`} className="card block overflow-hidden transition-shadow hover:shadow-cardHover">
              <div className="relative">
                <PhotoPlaceholder color={s.photoColor} height={132} className="rounded-none" />
                <div className="absolute right-3 top-3 flex gap-2">
                  {open > 0 && <span className="badge bg-white/90 text-warning">{open} open</span>}
                  <SiteStatusBadge status={s.status} />
                </div>
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="truncate text-sm font-semibold text-white drop-shadow">{s.name}</p>
                  <p className="text-[11px] text-white/85">{partnerNameById.get(s.partnerId)} · {s.city}</p>
                </div>
              </div>
              <div className="card-pad">
                <div className="grid grid-cols-3 gap-2">
                  <Cell label="Revenue / mo" value={s.monthly.length ? formatMoney(s.revenuePerMonthEur) : "—"} />
                  <Cell label="Uptime" value={s.monthly.length ? formatPercent(s.uptimePct, 1) : "—"} />
                  <Cell label="Sessions / day" value={s.monthly.length ? formatNumber(s.sessionsPerDay) : "—"} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-[11px] text-muted">
                  <span className="pill !px-2 !py-0.5 !text-[11px]"><BoltIcon className="h-3.5 w-3.5" /> {s.chargerCount} · {s.totalPowerKw} kW</span>
                  {(s.electricitySource === "grid_green" || s.electricitySource === "solar_hybrid") && (
                    <span className="pill !px-2 !py-0.5 !text-[11px] !text-success"><LeafIcon className="h-3.5 w-3.5" /> {ELEC_LABEL[s.electricitySource]}</span>
                  )}
                  {b && <PositionBadge position={b.position} />}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums text-ink">{value}</div>
    </div>
  );
}
