import Link from "next/link";
import { notFound } from "next/navigation";
import { getDeployment, getDeploymentSummary, getDocument, getPartner, getSite } from "@/lib/data";
import { PageHeader, Card, CardHeader, KeyValue, ProgressBar, ActionButton, PhotoPlaceholder } from "@/components/ui";
import { DeploymentStatusBadge } from "@/components/StatusBadge";
import { AiSummaryCard } from "@/components/AiSummaryCard";
import { MilestoneTimeline, type Step } from "@/components/Timeline";
import { AlertTriangleIcon, DocIcon, DownloadIcon, MailIcon, TruckIcon } from "@/components/Icons";
import { formatDate, titleCase } from "@/lib/utils";

export default function DeploymentDetailPage({ params }: { params: { id: string } }) {
  const dep = getDeployment(params.id);
  if (!dep) notFound();
  const partner = getPartner(dep.partnerId);
  const site = getSite(dep.siteId);
  const summary = getDeploymentSummary(dep.id);
  const docs = dep.documentIds.map((id) => getDocument(id)).filter(Boolean) as NonNullable<ReturnType<typeof getDocument>>[];
  const steps: Step[] = dep.milestones.map((m) => ({
    label: m.label,
    status: m.status,
    meta: m.completedAt ? `Completed ${formatDate(m.completedAt)}` : `Planned ${formatDate(m.plannedAt)}`,
    note: m.note,
  }));

  return (
    <div>
      <PageHeader
        title={dep.name}
        breadcrumb={[{ label: "Deployments", href: "/deployments" }, { label: dep.name, href: `/deployments/${dep.id}` }]}
        subtitle={`${dep.city}, ${dep.region} · ${dep.plannedChargers} chargers · ${dep.plannedPowerKw} kW`}
        actions={
          <>
            <ActionButton href="/partners" variant="secondary"><MailIcon className="h-4 w-4" /> Update partner</ActionButton>
            <ActionButton href="/deployments" variant="primary">Edit timeline</ActionButton>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <DeploymentStatusBadge deployment={dep} />
        {partner && <Link href={`/partners/${partner.id}`} className="pill hover:bg-slate-50">{partner.name}</Link>}
        {site && <Link href={`/sites/${site.id}`} className="pill hover:bg-slate-50">{site.name}</Link>}
        <span className="pill">Go-live {formatDate(dep.expectedGoLive)}</span>
      </div>

      {dep.delayed && dep.delayReason && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-medium text-ink">This deployment is running behind schedule</p>
            <p className="mt-0.5 text-sm text-amber-800">{dep.delayReason}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="card-pad">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="section-title">Overall progress</h2>
              <span className="text-sm font-semibold tabular-nums text-ink">{Math.round(dep.progress * 100)}%</span>
            </div>
            <ProgressBar value={dep.progress} tone={dep.delayed ? "amber" : "blue"} />
            <p className="mt-2 text-xs text-muted">{dep.milestones.filter((m) => m.status === "done").length} of {dep.milestones.length} milestones complete · next milestone: {dep.milestones.find((m) => m.status === "in_progress" || m.status === "blocked")?.label ?? "—"}</p>
          </Card>

          <Card>
            <CardHeader title="Milestones" subtitle="Permits → grid → civil works → delivery → install → commissioning → go-live" icon={<TruckIcon className="h-5 w-5" />} />
            <div className="card-pad">
              <MilestoneTimeline steps={steps} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Site preview" subtitle="Placeholder imagery — site photos appear here once on site" icon={<DocIcon className="h-5 w-5" />} />
            <div className="card-pad">
              <PhotoPlaceholder color={site?.photoColor ?? "#0B1F4D"} label={`${dep.city} — works site`} height={220} />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {summary && <AiSummaryCard summary={summary} />}
          <Card className="card-pad">
            <h2 className="section-title mb-3">Project details</h2>
            <dl>
              <KeyValue label="Status"><DeploymentStatusBadge deployment={dep} /></KeyValue>
              <KeyValue label="Expected go-live">{formatDate(dep.expectedGoLive)}</KeyValue>
              <KeyValue label="Chargers">{dep.plannedChargers}</KeyValue>
              <KeyValue label="Total power">{dep.plannedPowerKw} kW</KeyValue>
              <KeyValue label="Region">{dep.region}</KeyValue>
              <KeyValue label="Progress">{Math.round(dep.progress * 100)}%</KeyValue>
            </dl>
          </Card>
          <Card>
            <CardHeader title="Documents" subtitle="Permits, certificates, drawings" icon={<DocIcon className="h-5 w-5" />} />
            {docs.length === 0 ? (
              <p className="px-6 py-6 text-center text-sm text-muted">No documents attached yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-2.5 sm:px-6">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink">{d.name}</p>
                      <p className="text-[11px] text-muted">{titleCase(d.kind)} · {formatDate(d.uploadedAt)}</p>
                    </div>
                    <DownloadIcon className="h-4 w-4 shrink-0 text-slate-300" />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
