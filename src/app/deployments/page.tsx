import Link from "next/link";
import { getDeployments, getPartner, getSite } from "@/lib/data";
import { PageHeader, Card, CardHeader, KpiTile, ActionButton, ProgressBar } from "@/components/ui";
import { DeploymentStatusBadge } from "@/components/StatusBadge";
import { AlertTriangleIcon, PlusIcon, TruckIcon } from "@/components/Icons";
import { daysFromNow, formatDate, titleCase } from "@/lib/utils";

export default function DeploymentsPage() {
  const deployments = getDeployments();
  const delayed = deployments.filter((d) => d.delayed);
  const plannedChargers = deployments.reduce((n, d) => n + d.plannedChargers, 0);
  const nextGoLive = deployments.slice().sort((a, b) => +new Date(a.expectedGoLive) - +new Date(b.expectedGoLive))[0];

  return (
    <div>
      <PageHeader
        title="Deployments"
        subtitle="Track every site build — permits, grid connection, civil works, equipment delivery, commissioning and go-live."
        actions={<ActionButton variant="primary"><PlusIcon className="h-4 w-4" /> New deployment</ActionButton>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile label="Active deployments" value={`${deployments.length}`} icon={<TruckIcon className="h-5 w-5" />} sub={`${plannedChargers} chargers planned`} />
        <KpiTile label="Delayed" value={`${delayed.length}`} icon={<AlertTriangleIcon className="h-5 w-5" />} sub={delayed.length ? delayed.map((d) => d.city).join(", ") : "All on track"} />
        <KpiTile label="On track" value={`${deployments.length - delayed.length}`} icon={<TruckIcon className="h-5 w-5" />} />
        <KpiTile label="Next go-live" value={nextGoLive ? `${Math.max(0, daysFromNow(nextGoLive.expectedGoLive))}d` : "—"} icon={<TruckIcon className="h-5 w-5" />} sub={nextGoLive ? nextGoLive.name : "—"} />
      </div>

      <div className="mt-6 space-y-5">
        {deployments.map((d) => {
          const partner = getPartner(d.partnerId);
          const site = getSite(d.siteId);
          const done = d.milestones.filter((m) => m.status === "done").length;
          const current = d.milestones.find((m) => m.status === "in_progress") ?? d.milestones.find((m) => m.status === "blocked");
          return (
            <Card key={d.id}>
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/deployments/${d.id}`} className="text-base font-semibold text-ink hover:text-brand-600">{d.name}</Link>
                    <DeploymentStatusBadge deployment={d} />
                  </div>
                  <p className="mt-0.5 text-sm text-muted">
                    {partner && <Link href={`/partners/${partner.id}`} className="hover:text-brand-600">{partner.name}</Link>} · {d.city}, {d.region} · {d.plannedChargers} chargers · {d.plannedPowerKw} kW
                  </p>
                  {d.delayed && d.delayReason && (
                    <p className="mt-1.5 flex items-start gap-1.5 text-xs text-warning"><AlertTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {d.delayReason}</p>
                  )}
                </div>
                <div className="sm:w-72">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted">
                    <span>{done}/{d.milestones.length} milestones · next: {current?.label ?? "—"}</span>
                    <span className="tabular-nums font-medium text-ink">{Math.round(d.progress * 100)}%</span>
                  </div>
                  <ProgressBar value={d.progress} tone={d.delayed ? "amber" : "blue"} />
                  <p className="mt-1.5 text-[11px] text-muted">Expected go-live {formatDate(d.expectedGoLive)}{site ? ` · ${site.name}` : ""}</p>
                </div>
                <Link href={`/deployments/${d.id}`} className="btn-secondary shrink-0">View</Link>
              </div>
              <div className="border-t border-slate-100 px-5 py-3 sm:px-6">
                <div className="flex flex-wrap gap-1.5">
                  {d.milestones.map((m) => (
                    <span
                      key={m.stage}
                      title={`${m.label} — ${titleCase(m.status)}${m.completedAt ? ` (${formatDate(m.completedAt)})` : ` (planned ${formatDate(m.plannedAt)})`}`}
                      className={
                        "rounded-full px-2 py-0.5 text-[10px] font-medium " +
                        (m.status === "done" ? "bg-emerald-50 text-success" : m.status === "in_progress" ? "bg-blue-50 text-brand-600" : m.status === "blocked" ? "bg-red-50 text-danger" : "bg-slate-100 text-slate-400")
                      }
                    >
                      {m.label}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
