import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getContracts,
  getDeployments,
  getDocument,
  getDocuments,
  getIncidents,
  getPartner,
  getPartnerMetrics,
  getPartnerSummary,
  getRevenueReports,
  getSites,
  getUser,
  lastContactDays,
} from "@/lib/data";
import { PageHeader, Card, CardHeader, KpiTile, Avatar, ActionButton, KeyValue, ProgressBar } from "@/components/ui";
import { AreaTrendChart } from "@/components/Charts";
import { AiSummaryCard } from "@/components/AiSummaryCard";
import { CampaignStatusBadge, ContractStatusBadge, DeploymentStatusBadge, IncidentStatusBadge, PartnerStatusBadge, ReportStatusBadge, SiteStatusBadge } from "@/components/StatusBadge";
import { getCampaigns } from "@/lib/data";
import { CoinIcon, DocIcon, DownloadIcon, MailIcon, PinIcon, TruckIcon, WrenchIcon } from "@/components/Icons";
import { formatDate, formatMoney, formatMoneyCompact, formatMonth, formatPercent, titleCase } from "@/lib/utils";

export default function PartnerDetailPage({ params }: { params: { id: string } }) {
  const partner = getPartner(params.id);
  if (!partner) notFound();
  const pm = getPartnerMetrics(partner.id);
  const summary = getPartnerSummary(partner.id);
  const sites = getSites({ partnerId: partner.id });
  const incidents = getIncidents({ partnerId: partner.id });
  const openIncidents = incidents.filter((i) => i.status !== "resolved");
  const deployments = getDeployments({ partnerId: partner.id });
  const reports = getRevenueReports({ partnerId: partner.id });
  const contracts = getContracts({ partnerId: partner.id });
  const documents = getDocuments({ partnerId: partner.id });
  const campaigns = getCampaigns({ partnerId: partner.id });
  const am = getUser(partner.accountManagerId);
  const overdue = lastContactDays(partner);
  const chart = pm.monthly.map((x) => ({ month: x.month, revenueEur: x.revenueEur }));

  return (
    <div>
      <PageHeader
        title={partner.name}
        breadcrumb={[{ label: "Partners", href: "/partners" }, { label: partner.name, href: `/partners/${partner.id}` }]}
        subtitle={`${titleCase(partner.type)} · ${partner.city}, ${partner.region} · partner since ${formatDate(partner.since)}`}
        actions={
          <>
            <ActionButton href="/partners" variant="secondary">
              <MailIcon className="h-4 w-4" /> Draft email
            </ActionButton>
            <ActionButton href="/reports" variant="primary">
              <DownloadIcon className="h-4 w-4" /> Generate report
            </ActionButton>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Avatar name={partner.name} color={partner.logoColor} size={48} />
        <PartnerStatusBadge status={partner.status} />
        <span className="pill">Royalty share {formatPercent(partner.royaltyRate)}</span>
        <span className={overdue >= 30 ? "pill !border-amber-200 !text-warning" : "pill"}>Last contact {overdue}d ago</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Sites" value={`${pm.sitesCount}`} icon={<PinIcon className="h-5 w-5" />} sub={`${pm.liveSitesCount} live · ${pm.chargersCount} chargers`} />
        <KpiTile label="Revenue / month" value={formatMoneyCompact(pm.revenueThisMonth)} icon={<CoinIcon className="h-5 w-5" />} sub={pm.avgUptime != null ? `${formatPercent(pm.avgUptime, 1)} avg uptime` : "—"} />
        <KpiTile label="Est. next payout" value={pm.estimatedNextPayout != null ? formatMoneyCompact(pm.estimatedNextPayout) : "—"} icon={<CoinIcon className="h-5 w-5" />} sub="Avg of last 3 royalty statements" />
        <KpiTile label="Open incidents" value={`${pm.openIncidentsCount}`} icon={<WrenchIcon className="h-5 w-5" />} sub={`${pm.activeDeploymentsCount} active deployments`} deltaInvert />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {chart.length > 1 && (
            <Card>
              <CardHeader title="Revenue" subtitle="Monthly charging revenue across this partner's sites" icon={<CoinIcon className="h-5 w-5" />} />
              <div className="card-pad pt-2">
                <AreaTrendChart data={chart} xKey="month" yKey="revenueEur" label="Revenue" format="moneyCompact" height={210} />
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Sites" subtitle={`${sites.length} site${sites.length === 1 ? "" : "s"}`} icon={<PinIcon className="h-5 w-5" />} />
            <div className="divide-y divide-slate-100">
              {sites.map((s) => (
                <Link key={s.id} href={`/sites/${s.id}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50 sm:px-6">
                  <span className="h-9 w-9 shrink-0 rounded-lg" style={{ background: `linear-gradient(135deg, ${s.photoColor}, ${s.photoColor}aa)` }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{s.name}</p>
                    <p className="text-xs text-muted">{s.city} · {s.chargerCount} chargers · {s.totalPowerKw} kW</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-medium tabular-nums text-ink">{s.monthly.length ? formatMoney(s.revenuePerMonthEur) : "—"}</p>
                    <p className="text-[11px] text-muted">{s.monthly.length ? `${formatPercent(s.uptimePct, 1)} uptime` : "not live"}</p>
                  </div>
                  <SiteStatusBadge status={s.status} />
                </Link>
              ))}
            </div>
          </Card>

          {openIncidents.length > 0 && (
            <Card>
              <CardHeader title="Open incidents" icon={<WrenchIcon className="h-5 w-5" />} action={<Link href="/incidents" className="text-xs font-medium text-brand-600">All →</Link>} />
              <div className="divide-y divide-slate-100">
                {openIncidents.map((i) => {
                  const site = sites.find((s) => s.id === i.siteId);
                  return (
                    <Link key={i.id} href={`/incidents/${i.id}`} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50 sm:px-6">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{i.title}</p>
                        <p className="text-xs text-muted">{site?.name} · {titleCase(i.category)} · opened {formatDate(i.openedAt)}</p>
                      </div>
                      <IncidentStatusBadge status={i.status} />
                    </Link>
                  );
                })}
              </div>
            </Card>
          )}

          {deployments.length > 0 && (
            <Card>
              <CardHeader title="Deployments" icon={<TruckIcon className="h-5 w-5" />} />
              <div className="divide-y divide-slate-100">
                {deployments.map((d) => (
                  <Link key={d.id} href={`/deployments/${d.id}`} className="block px-5 py-3.5 transition-colors hover:bg-slate-50 sm:px-6">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-ink">{d.name}</p>
                      <DeploymentStatusBadge deployment={d} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted">Go-live {formatMonth(d.expectedGoLive)} · {d.plannedChargers} chargers</p>
                    <div className="mt-2 flex items-center gap-3">
                      <ProgressBar value={d.progress} tone={d.delayed ? "amber" : "blue"} className="flex-1" />
                      <span className="text-xs font-medium tabular-nums text-ink">{Math.round(d.progress * 100)}%</span>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {campaigns.length > 0 && (
            <Card>
              <CardHeader title="Campaigns" icon={<DocIcon className="h-5 w-5" />} action={<Link href="/campaigns" className="text-xs font-medium text-brand-600">All →</Link>} />
              <div className="divide-y divide-slate-100">
                {campaigns.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{c.name}</p>
                      <p className="text-xs text-muted">{titleCase(c.type)} · {c.sessionsGenerated.toLocaleString("en-US")} sessions · {formatPercent(c.estimatedUpliftPct)} est. uplift</p>
                    </div>
                    <CampaignStatusBadge status={c.status} />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {summary && <AiSummaryCard summary={summary} />}

          <Card className="card-pad">
            <h2 className="section-title mb-3">Contact</h2>
            <dl>
              <KeyValue label="Primary contact">{partner.contactName}</KeyValue>
              <KeyValue label="Email">{partner.contactEmail}</KeyValue>
              {partner.contactPhone && <KeyValue label="Phone">{partner.contactPhone}</KeyValue>}
              <KeyValue label="Account manager">{am?.name ?? "—"}</KeyValue>
              <KeyValue label="Partner since">{formatDate(partner.since)}</KeyValue>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Recent royalty statements" icon={<CoinIcon className="h-5 w-5" />} action={<Link href="/revenues" className="text-xs font-medium text-brand-600">All →</Link>} />
            <div className="divide-y divide-slate-100">
              {reports.slice(0, 4).map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-3 sm:px-6">
                  <div>
                    <p className="text-sm font-medium text-ink">{formatMonth(r.month)}</p>
                    <p className="text-[11px] text-muted">{r.siteIds.length} sites · gross {formatMoney(r.grossRevenueEur)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums text-ink">{formatMoney(r.royaltyEur)}</p>
                    <ReportStatusBadge status={r.status} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Contracts" icon={<DocIcon className="h-5 w-5" />} />
            <div className="divide-y divide-slate-100">
              {contracts.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 px-5 py-3 sm:px-6">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{c.title}</p>
                    <p className="text-[11px] text-muted">{titleCase(c.type)} · {formatDate(c.startsAt)} – {formatDate(c.endsAt)}</p>
                  </div>
                  <ContractStatusBadge status={c.status} />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Documents" icon={<DocIcon className="h-5 w-5" />} action={<Link href="/documents" className="text-xs font-medium text-brand-600">All →</Link>} />
            <ul className="divide-y divide-slate-100">
              {documents.slice(0, 6).map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-2.5 sm:px-6">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink">{d.name}</p>
                    <p className="text-[11px] text-muted">{titleCase(d.kind)} · {Math.round(d.sizeKb)} KB · {formatDate(d.uploadedAt)}</p>
                  </div>
                  <DownloadIcon className="h-4 w-4 shrink-0 text-slate-300" />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
