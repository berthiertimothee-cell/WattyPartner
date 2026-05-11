import Link from "next/link";
import { getDocuments, getPartner, getPartnerMetrics, getPartners, getRevenueReports, getReportSummary } from "@/lib/data";
import { PageHeader, Card, CardHeader, KpiTile, ActionButton, LinkButton } from "@/components/ui";
import { AiSummaryCard } from "@/components/AiSummaryCard";
import { ReportStatusBadge } from "@/components/StatusBadge";
import { ChartIcon, DownloadIcon, MailIcon } from "@/components/Icons";
import { formatDate, formatMoney, formatMonth, formatPercent } from "@/lib/utils";

export default function ReportsPage() {
  const partners = getPartners();
  const reportDocs = getDocuments({ kind: "report" });
  const allReports = getRevenueReports();
  const months = [...new Set(allReports.map((r) => r.month))].sort().reverse();
  const latestMonth = months[0];
  // Preview: AI-generated monthly report for the latest statement of the first partner with one.
  const previewReport = allReports.find((r) => r.month === latestMonth) ?? allReports[0];
  const previewSummary = previewReport ? getReportSummary(previewReport.id) : undefined;
  const previewPartner = previewReport ? getPartner(previewReport.partnerId) : undefined;

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Generate monthly partner reports — performance, uptime, incidents, revenue and royalties — and share or download them as PDF."
        actions={<ActionButton variant="primary"><ChartIcon className="h-4 w-4" /> Generate {latestMonth ? formatMonth(latestMonth) : "monthly"} reports</ActionButton>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile label="Report period" value={latestMonth ? formatMonth(latestMonth) : "—"} icon={<ChartIcon className="h-5 w-5" />} sub="Latest closed month" />
        <KpiTile label="Generated reports" value={`${reportDocs.length}`} icon={<DownloadIcon className="h-5 w-5" />} sub="Available to download" />
        <KpiTile label="Partners" value={`${partners.length}`} icon={<ChartIcon className="h-5 w-5" />} sub="Eligible for monthly reports" />
        <KpiTile label="Statements issued" value={`${allReports.filter((r) => r.month === latestMonth).length}`} icon={<ChartIcon className="h-5 w-5" />} sub={`for ${latestMonth ? formatMonth(latestMonth) : "—"}`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Monthly partner reports" subtitle={`One row per partner — ${latestMonth ? formatMonth(latestMonth) : "current"} period`} icon={<ChartIcon className="h-5 w-5" />} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-5 py-2.5 sm:px-6">Partner</th>
                    <th className="px-3 py-2.5">Sites</th>
                    <th className="px-3 py-2.5 text-right">Revenue / mo</th>
                    <th className="px-3 py-2.5 text-right">Avg uptime</th>
                    <th className="px-3 py-2.5 text-right">Royalty</th>
                    <th className="px-5 py-2.5 text-right sm:px-6">Report</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((p) => {
                    const pm = getPartnerMetrics(p.id);
                    const r = allReports.find((x) => x.partnerId === p.id && x.month === latestMonth) ?? getRevenueReports({ partnerId: p.id })[0];
                    return (
                      <tr key={p.id} className="table-row">
                        <td className="px-5 py-3 sm:px-6"><Link href={`/partners/${p.id}`} className="font-medium text-ink hover:text-brand-600">{p.name}</Link></td>
                        <td className="px-3 py-3 text-slate-600">{pm.liveSitesCount}/{pm.sitesCount}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-slate-600">{formatMoney(pm.revenueThisMonth)}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-slate-600">{pm.avgUptime != null ? formatPercent(pm.avgUptime, 1) : "—"}</td>
                        <td className="px-3 py-3 text-right tabular-nums font-medium text-ink">{r ? formatMoney(r.royaltyEur) : "—"}</td>
                        <td className="px-5 py-3 text-right sm:px-6">
                          <span className="inline-flex items-center gap-2">
                            {r && <ReportStatusBadge status={r.status} />}
                            <LinkButton href="/reports/monthly-partner-report-sample.pdf" variant="ghost" className="!px-2 !py-1 text-brand-600" >
                              <DownloadIcon className="h-4 w-4" />
                            </LinkButton>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader title="Recently generated" subtitle="Downloadable PDFs" icon={<DownloadIcon className="h-5 w-5" />} />
            <ul className="divide-y divide-slate-100">
              {reportDocs.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-3 sm:px-6">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{d.name}</p>
                    <p className="text-[11px] text-muted">{Math.round(d.sizeKb)} KB · generated {formatDate(d.uploadedAt)} by {d.uploadedBy}</p>
                  </div>
                  <LinkButton href="/reports/monthly-partner-report-sample.pdf" className="!py-1.5" variant="secondary">
                    <DownloadIcon className="h-4 w-4" /> PDF
                  </LinkButton>
                </li>
              ))}
              {reportDocs.length === 0 && <li className="px-6 py-6 text-center text-sm text-muted">No reports generated yet.</li>}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          {previewSummary && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-1 shadow-card">
                <div className="rounded-xl bg-gradient-to-br from-brand to-brand-600 px-5 py-4 text-white">
                  <p className="text-xs font-medium uppercase tracking-wide text-white/70">Monthly partner report — preview</p>
                  <p className="mt-1 text-lg font-semibold">{previewPartner?.name}</p>
                  <p className="text-sm text-white/80">{previewReport ? formatMonth(previewReport.month) : ""} · prepared by Watty PartnerOS</p>
                </div>
              </div>
              <AiSummaryCard summary={previewSummary} />
              <div className="flex gap-2">
                <ActionButton className="flex-1 justify-center"><MailIcon className="h-4 w-4" /> Send to partner</ActionButton>
                <LinkButton href="/reports/monthly-partner-report-sample.pdf" variant="primary" className="flex-1 justify-center">
                  <DownloadIcon className="h-4 w-4" /> Download PDF
                </LinkButton>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
