import Link from "next/link";
import { notFound } from "next/navigation";
import { getIncident, getIncidentSummary, getMaintenanceProvider, getPartner, getSite, slaHoursOver } from "@/lib/data";
import { PageHeader, Card, CardHeader, KeyValue, PhotoPlaceholder, ActionButton, Badge } from "@/components/ui";
import { IncidentStatusBadge, SeverityLevelBadge } from "@/components/StatusBadge";
import { AiSummaryCard } from "@/components/AiSummaryCard";
import { Timeline } from "@/components/Timeline";
import { MailIcon, WrenchIcon } from "@/components/Icons";
import { daysBetween, formatDate, formatDateTime, titleCase } from "@/lib/utils";

export default function IncidentDetailPage({ params }: { params: { id: string } }) {
  const incident = getIncident(params.id);
  if (!incident) notFound();
  const site = getSite(incident.siteId);
  const partner = site ? getPartner(site.partnerId) : undefined;
  const provider = getMaintenanceProvider(incident.maintenanceProviderId);
  const summary = getIncidentSummary(incident.id);
  const over = slaHoursOver(incident);
  const ageDays = daysBetween(incident.openedAt, incident.resolvedAt ?? new Date().toISOString());

  return (
    <div>
      <PageHeader
        title={incident.title}
        breadcrumb={[{ label: "Incidents", href: "/incidents" }, { label: incident.id, href: `/incidents/${incident.id}` }]}
        subtitle={site ? `${site.name} · ${site.city}` : undefined}
        actions={
          <>
            <ActionButton href="/partners" variant="secondary"><MailIcon className="h-4 w-4" /> Update partner</ActionButton>
            <ActionButton href="/incidents" variant="primary">Change status</ActionButton>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <IncidentStatusBadge status={incident.status} />
        <SeverityLevelBadge severity={incident.severity} />
        <span className="pill">{titleCase(incident.category)}</span>
        {site && <Link href={`/sites/${site.id}`} className="pill hover:bg-slate-50">{site.name}</Link>}
        {partner && <Link href={`/partners/${partner.id}`} className="pill hover:bg-slate-50">{partner.name}</Link>}
        {!incident.resolvedAt && (over > 0 ? <Badge tone="red">SLA overdue {Math.round(over)}h</Badge> : over > -12 ? <Badge tone="amber">SLA in {Math.round(-over)}h</Badge> : null)}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="card-pad">
            <h2 className="section-title mb-2">Description</h2>
            <p className="text-sm leading-relaxed text-slate-700">{incident.description}</p>
            {incident.photoColors.length > 0 && (
              <div className="mt-4">
                <p className="stat-label mb-2">Attached photos ({incident.photoColors.length})</p>
                <div className="flex flex-wrap gap-3">
                  {incident.photoColors.map((c, i) => (
                    <PhotoPlaceholder key={i} color={c} height={96} className="w-40" label={`IMG_${100 + i}`} />
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Incident timeline" subtitle={`${incident.timeline.length} updates`} icon={<WrenchIcon className="h-5 w-5" />} />
            <div className="card-pad">
              <Timeline events={incident.timeline} />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {summary && <AiSummaryCard summary={summary} compact />}
          <Card className="card-pad">
            <h2 className="section-title mb-3">Ticket details</h2>
            <dl>
              <KeyValue label="Status"><IncidentStatusBadge status={incident.status} /></KeyValue>
              <KeyValue label="Severity"><SeverityLevelBadge severity={incident.severity} /></KeyValue>
              <KeyValue label="Category">{titleCase(incident.category)}</KeyValue>
              {incident.chargerId && <KeyValue label="Affected unit">{incident.chargerId.split("_").pop()}</KeyValue>}
              <KeyValue label="Opened">{formatDateTime(incident.openedAt)}</KeyValue>
              <KeyValue label="SLA target">{formatDate(incident.slaDueAt)}</KeyValue>
              {incident.etaAt && <KeyValue label="Communicated ETA">{formatDate(incident.etaAt)}</KeyValue>}
              {incident.resolvedAt && <KeyValue label="Resolved">{formatDateTime(incident.resolvedAt)}</KeyValue>}
              <KeyValue label="Age">{ageDays} day{ageDays === 1 ? "" : "s"}{incident.resolvedAt ? " to resolve" : " open"}</KeyValue>
            </dl>
          </Card>
          {provider && (
            <Card className="card-pad">
              <h2 className="section-title mb-3">Assigned provider</h2>
              <dl>
                <KeyValue label="Contractor">{provider.name}</KeyValue>
                <KeyValue label="Regions">{provider.regions.join(", ")}</KeyValue>
                <KeyValue label="Avg resolution">~{provider.avgResolutionHours}h</KeyValue>
                <KeyValue label="Rating">★ {provider.rating.toFixed(1)}</KeyValue>
                <KeyValue label="Contact">{provider.contactEmail}</KeyValue>
                <KeyValue label="Phone">{provider.phone}</KeyValue>
              </dl>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
