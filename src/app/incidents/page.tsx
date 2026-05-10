import Link from "next/link";
import { getIncidents, getMaintenanceProvider, getMaintenanceProviders, getPartner, getSite, isIncidentOpen, slaHoursOver } from "@/lib/data";
import { PageHeader, Card, CardHeader, KpiTile, ActionButton, Badge } from "@/components/ui";
import { IncidentStatusBadge, SeverityLevelBadge } from "@/components/StatusBadge";
import { AlertTriangleIcon, ClockIcon, PlusIcon, WrenchIcon } from "@/components/Icons";
import { formatDate, relativeTime, titleCase } from "@/lib/utils";
import type { IncidentStatus } from "@/lib/types";

const STATUS_ORDER: IncidentStatus[] = ["open", "in_progress", "waiting_external", "scheduled", "resolved"];
const STATUS_LABEL: Record<IncidentStatus, string> = { open: "Open", in_progress: "In progress", waiting_external: "Waiting external provider", scheduled: "Scheduled", resolved: "Resolved" };

export default function IncidentsPage() {
  const all = getIncidents();
  const open = all.filter(isIncidentOpen);
  const atRisk = open.filter((i) => slaHoursOver(i) > -12);
  const providers = getMaintenanceProviders();
  const byStatus = new Map<IncidentStatus, typeof all>();
  for (const s of STATUS_ORDER) byStatus.set(s, all.filter((i) => i.status === s));

  return (
    <div>
      <PageHeader
        title="Incidents & maintenance"
        subtitle="Centralized ticketing — incident creation, contractor assignment, SLA tracking, ETAs and repair history."
        actions={<ActionButton variant="primary"><PlusIcon className="h-4 w-4" /> Report incident</ActionButton>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile label="Open incidents" value={`${open.length}`} icon={<WrenchIcon className="h-5 w-5" />} sub={`${all.filter((i) => i.severity === "high" && i.status !== "resolved").length} high severity`} />
        <KpiTile label="At SLA risk" value={`${atRisk.length}`} icon={<AlertTriangleIcon className="h-5 w-5" />} sub="Within 12h of breach or overdue" />
        <KpiTile label="Scheduled / waiting" value={`${(byStatus.get("scheduled")?.length ?? 0) + (byStatus.get("waiting_external")?.length ?? 0)}`} icon={<ClockIcon className="h-5 w-5" />} sub="Awaiting parts or field visit" />
        <KpiTile label="Resolved (logged)" value={`${byStatus.get("resolved")?.length ?? 0}`} icon={<WrenchIcon className="h-5 w-5" />} sub="In repair history" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {STATUS_ORDER.map((status) => {
            const list = byStatus.get(status)!;
            if (!list.length) return null;
            return (
              <Card key={status}>
                <CardHeader title={STATUS_LABEL[status]} subtitle={`${list.length} incident${list.length === 1 ? "" : "s"}`} icon={<IncidentStatusBadge status={status} />} />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="px-5 py-2.5 sm:px-6">Incident</th>
                        <th className="px-3 py-2.5">Site</th>
                        <th className="px-3 py-2.5">Category</th>
                        <th className="px-3 py-2.5">Severity</th>
                        <th className="px-3 py-2.5">Provider</th>
                        <th className="px-5 py-2.5 text-right sm:px-6">{status === "resolved" ? "Resolved" : "SLA / ETA"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((i) => {
                        const site = getSite(i.siteId);
                        const partner = site ? getPartner(site.partnerId) : undefined;
                        const provider = getMaintenanceProvider(i.maintenanceProviderId);
                        const over = slaHoursOver(i);
                        return (
                          <tr key={i.id} className="table-row align-top">
                            <td className="px-5 py-3 sm:px-6">
                              <Link href={`/incidents/${i.id}`} className="font-medium text-ink hover:text-brand-600">{i.title}</Link>
                              <div className="text-[11px] text-muted">opened {relativeTime(i.openedAt)}</div>
                            </td>
                            <td className="px-3 py-3 text-slate-600">
                              {site && <Link href={`/sites/${site.id}`} className="hover:text-brand-600">{site.name}</Link>}
                              <div className="text-[11px] text-muted">{partner?.name}</div>
                            </td>
                            <td className="px-3 py-3 text-slate-600">{titleCase(i.category)}</td>
                            <td className="px-3 py-3"><SeverityLevelBadge severity={i.severity} /></td>
                            <td className="px-3 py-3 text-slate-600">{provider?.name ?? <span className="text-slate-400">Unassigned</span>}</td>
                            <td className="px-5 py-3 text-right sm:px-6">
                              {i.resolvedAt ? (
                                <span className="text-slate-600">{formatDate(i.resolvedAt)}</span>
                              ) : (
                                <div className="flex flex-col items-end gap-0.5">
                                  {over > 0 ? <Badge tone="red">SLA overdue {Math.round(over)}h</Badge> : over > -12 ? <Badge tone="amber">SLA in {Math.round(-over)}h</Badge> : <span className="text-[11px] text-muted">SLA {formatDate(i.slaDueAt)}</span>}
                                  {i.etaAt && <span className="text-[11px] text-muted">ETA {formatDate(i.etaAt)}</span>}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Maintenance providers" subtitle="Contractors & SLA performance" icon={<WrenchIcon className="h-5 w-5" />} />
            <div className="divide-y divide-slate-100">
              {providers.map((p) => {
                const activeJobs = open.filter((i) => i.maintenanceProviderId === p.id).length;
                return (
                  <div key={p.id} className="px-5 py-3.5 sm:px-6">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-ink">{p.name}</p>
                      <Badge tone={p.avgResolutionHours <= 30 ? "green" : p.avgResolutionHours <= 40 ? "amber" : "red"}>~{p.avgResolutionHours}h avg</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{p.regions.join(", ")} · ★ {p.rating.toFixed(1)}</p>
                    <p className="mt-1 text-[11px] text-muted">{activeJobs} active job{activeJobs === 1 ? "" : "s"} · {p.contactEmail}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="card-pad">
            <h2 className="section-title mb-2">Workflow</h2>
            <p className="text-xs text-muted">Incidents move through these statuses:</p>
            <div className="mt-3 space-y-2">
              {STATUS_ORDER.map((s) => (
                <div key={s} className="flex items-center gap-2 text-sm text-slate-700">
                  <IncidentStatusBadge status={s} />
                  <span className="text-xs text-muted">
                    {s === "open" && "Detected or reported, not yet triaged"}
                    {s === "in_progress" && "Being worked, remote or on-site"}
                    {s === "waiting_external" && "Blocked on a parts order or third party"}
                    {s === "scheduled" && "Field visit booked with an ETA"}
                    {s === "resolved" && "Fixed and verified; partner notified"}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
