import Link from "next/link";
import { getIncidents, getPartnerMetrics, getPartners, getUser, lastContactDays } from "@/lib/data";
import { PageHeader, Card, Avatar, ActionButton } from "@/components/ui";
import { PartnerStatusBadge } from "@/components/StatusBadge";
import { ArrowUpRight, PlusIcon, UsersIcon } from "@/components/Icons";
import { formatMoney, formatPercent, titleCase } from "@/lib/utils";

export default function PartnersPage() {
  const partners = getPartners();
  return (
    <div>
      <PageHeader
        title="Partners"
        subtitle="Retailers, hotels, real-estate groups, fleets and municipalities operating charging sites with Watty."
        actions={
          <ActionButton href="/partners" variant="primary">
            <PlusIcon className="h-4 w-4" /> Add partner
          </ActionButton>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="pill"><UsersIcon className="h-4 w-4 text-slate-400" /> {partners.length} partners</span>
        <span className="pill">{partners.filter((p) => p.status === "active").length} active</span>
        <span className="pill">{partners.filter((p) => p.status === "onboarding").length} onboarding</span>
        <span className="pill">{partners.filter((p) => lastContactDays(p) >= 30).length} need a check-in</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {partners.map((p) => {
          const pm = getPartnerMetrics(p.id);
          const am = getUser(p.accountManagerId);
          const overdue = lastContactDays(p);
          return (
            <Link key={p.id} href={`/partners/${p.id}`} className="card card-pad block transition-shadow hover:shadow-cardHover">
              <div className="flex items-start gap-3">
                <Avatar name={p.name} color={p.logoColor} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                    <PartnerStatusBadge status={p.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{titleCase(p.type)} · {p.city}, {p.region}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Mini label="Sites" value={`${pm.sitesCount}`} sub={`${pm.chargersCount} chargers`} />
                <Mini label="Revenue / mo" value={formatMoney(pm.revenueThisMonth)} sub={pm.avgUptime != null ? `${formatPercent(pm.avgUptime, 1)} uptime` : "—"} />
                <Mini label="Royalty share" value={formatPercent(p.royaltyRate)} sub={pm.openIncidentsCount ? `${pm.openIncidentsCount} open inc.` : "no incidents"} />
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="text-muted">AM: {am?.name ?? "—"}</span>
                <span className={overdue >= 30 ? "font-medium text-warning" : "text-muted"}>
                  {overdue >= 30 ? `Last contact ${overdue}d ago` : `Contacted ${overdue}d ago`}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Mini({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums text-ink">{value}</div>
      {sub && <div className="text-[11px] text-muted">{sub}</div>}
    </div>
  );
}
