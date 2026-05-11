import Link from "next/link";
import { getPartner, getPartners, getRevenueReports, getSite } from "@/lib/data";
import { PageHeader, Card, CardHeader, KpiTile, ActionButton, Badge } from "@/components/ui";
import { ReportStatusBadge } from "@/components/StatusBadge";
import { AlertTriangleIcon, CoinIcon, DownloadIcon } from "@/components/Icons";
import { formatMoney, formatMoneyCompact, formatMonth, formatPercent, titleCase } from "@/lib/utils";
import type { RoyaltyLine } from "@/lib/types";

export default function RevenuesPage() {
  const reports = getRevenueReports();
  const partners = getPartners();
  const months = [...new Set(reports.map((r) => r.month))].sort().reverse();
  const latestMonth = months[0];
  const latest = reports.filter((r) => r.month === latestMonth);
  const grossLatest = latest.reduce((n, r) => n + r.grossRevenueEur, 0);
  const royaltyLatest = latest.reduce((n, r) => n + r.royaltyEur, 0);
  const energyLatest = latest.reduce((n, r) => n + r.energyCostEur, 0);
  const feeLatest = latest.reduce((n, r) => n + r.platformFeeEur, 0);
  const issuedUnpaid = reports.filter((r) => r.status === "issued");
  const discrepancies = reports.filter((r) => r.discrepancy?.detected);
  const exampleReport = reports.find((r) => r.discrepancy?.detected) ?? latest[0] ?? reports[0];

  return (
    <div>
      <PageHeader
        title="Revenue & royalties"
        subtitle="Transparent monthly accounting — gross revenue, electricity costs, platform fee, the partner's revenue share, invoices and payouts."
        actions={<ActionButton href="/reports" variant="primary"><DownloadIcon className="h-4 w-4" /> Export {latestMonth ? formatMonth(latestMonth) : "month"}</ActionButton>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile label={`Gross revenue (${latestMonth ? formatMonth(latestMonth) : "—"})`} value={formatMoneyCompact(grossLatest)} icon={<CoinIcon className="h-5 w-5" />} sub={`${latest.length} partner statements`} />
        <KpiTile label="Partner royalties" value={formatMoneyCompact(royaltyLatest)} icon={<CoinIcon className="h-5 w-5" />} sub={`${formatPercent(grossLatest ? royaltyLatest / grossLatest : 0)} of gross`} />
        <KpiTile label="Electricity supply cost" value={formatMoneyCompact(energyLatest)} icon={<CoinIcon className="h-5 w-5" />} sub="Pass-through to net revenue" />
        <KpiTile label="Awaiting payment" value={formatMoneyCompact(issuedUnpaid.reduce((n, r) => n + r.royaltyEur, 0))} icon={<CoinIcon className="h-5 w-5" />} sub={`${issuedUnpaid.length} issued statements`} />
      </div>

      {discrepancies.length > 0 && (
        <div className="mt-6 space-y-3">
          {discrepancies.map((r) => {
            const p = getPartner(r.partnerId);
            return (
              <div key={r.id} className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">Discrepancy flagged — {p?.name}, {formatMonth(r.month)}</p>
                  <p className="mt-0.5 text-sm text-amber-800">{r.discrepancy!.note}</p>
                </div>
                {p && <Link href={`/partners/${p.id}`} className="btn-secondary shrink-0 !py-1.5">Open partner</Link>}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Royalty statements" subtitle="Newest first" icon={<CoinIcon className="h-5 w-5" />} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-5 py-2.5 sm:px-6">Partner</th>
                    <th className="px-3 py-2.5">Month</th>
                    <th className="px-3 py-2.5 text-right">Gross</th>
                    <th className="px-3 py-2.5 text-right">Electricity</th>
                    <th className="px-3 py-2.5 text-right">Platform fee</th>
                    <th className="px-3 py-2.5 text-right">Royalty</th>
                    <th className="px-5 py-2.5 text-right sm:px-6">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => {
                    const p = getPartner(r.partnerId);
                    return (
                      <tr key={r.id} className="table-row">
                        <td className="px-5 py-3 sm:px-6">
                          {p && <Link href={`/partners/${p.id}`} className="font-medium text-ink hover:text-brand-600">{p.name}</Link>}
                          <div className="text-[11px] text-muted">{r.siteIds.length} site{r.siteIds.length === 1 ? "" : "s"}{r.discrepancy?.detected ? " · flagged" : ""}</div>
                        </td>
                        <td className="px-3 py-3 text-slate-600">{formatMonth(r.month)}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-slate-600">{formatMoney(r.grossRevenueEur)}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-slate-500">−{formatMoney(r.energyCostEur)}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-slate-500">−{formatMoney(r.platformFeeEur)}</td>
                        <td className="px-3 py-3 text-right font-semibold tabular-nums text-ink">{formatMoney(r.royaltyEur)}</td>
                        <td className="px-5 py-3 text-right sm:px-6"><ReportStatusBadge status={r.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader title="Payment history" subtitle="Paid statements" icon={<CoinIcon className="h-5 w-5" />} />
            <div className="divide-y divide-slate-100">
              {reports.filter((r) => r.status === "paid").map((r) => {
                const p = getPartner(r.partnerId);
                return (
                  <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-3 sm:px-6">
                    <div>
                      <p className="text-sm font-medium text-ink">{p?.name}</p>
                      <p className="text-[11px] text-muted">{formatMonth(r.month)} statement · paid {r.paidAt ? new Date(r.paidAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums text-ink">{formatMoney(r.royaltyEur)}</p>
                      <Badge tone="green">Paid</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {exampleReport && <RoyaltyExplainer lines={exampleReport.lines} partnerName={getPartner(exampleReport.partnerId)?.name ?? "Partner"} month={exampleReport.month} royaltyRate={getPartner(exampleReport.partnerId)?.royaltyRate ?? 0} />}
          <Card className="card-pad">
            <h2 className="section-title mb-2">Estimated next payouts</h2>
            <p className="text-xs text-muted">Projection = average of each partner’s last three royalty statements.</p>
            <div className="mt-3 space-y-1">
              {partners.map((p) => {
                const rs = getRevenueReports({ partnerId: p.id }).slice(0, 3).map((r) => r.royaltyEur);
                if (!rs.length) return null;
                const est = Math.round(rs.reduce((a, b) => a + b, 0) / rs.length);
                return (
                  <div key={p.id} className="flex items-center justify-between py-1.5 text-sm">
                    <Link href={`/partners/${p.id}`} className="text-slate-700 hover:text-brand-600">{p.name}</Link>
                    <span className="font-medium tabular-nums text-ink">{formatMoney(est)}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** A simple "waterfall" visual so non-technical partners see how the royalty is built. */
function RoyaltyExplainer({ lines, partnerName, month, royaltyRate }: { lines: RoyaltyLine[]; partnerName: string; month: string; royaltyRate: number }) {
  const gross = lines.find((l) => l.kind === "gross_revenue")?.amountEur ?? 0;
  const royalty = lines.find((l) => l.kind === "royalty")?.amountEur ?? 0;
  const segments = lines.map((l) => ({ ...l, frac: gross ? Math.min(1, Math.abs(l.amountEur) / gross) : 0 }));
  const colorFor = (k: RoyaltyLine["kind"]) => (k === "gross_revenue" ? "#1E4ED8" : k === "energy_cost" ? "#F59E0B" : k === "platform_fee" ? "#94A3B8" : k === "adjustment" ? "#16A34A" : "#0B1F4D");
  return (
    <Card>
      <CardHeader title="How the royalty is calculated" subtitle={`${partnerName} · ${formatMonth(month)} · ${formatPercent(royaltyRate)} share`} icon={<CoinIcon className="h-5 w-5" />} />
      <div className="card-pad space-y-3">
        {segments.map((s) => (
          <div key={s.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-slate-600">{s.label}</span>
              <span className={"font-medium tabular-nums " + (s.amountEur < 0 ? "text-slate-500" : "text-ink")}>{s.amountEur < 0 ? "−" : ""}{formatMoney(Math.abs(s.amountEur))}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full" style={{ width: `${Math.max(4, s.frac * 100)}%`, backgroundColor: colorFor(s.kind) }} />
            </div>
          </div>
        ))}
        <div className="mt-1 rounded-xl bg-slate-50 p-3 text-sm">
          <span className="text-slate-600">Net to {partnerName.split(" ")[0]}: </span>
          <span className="font-semibold text-ink">{formatMoney(royalty)}</span>
          <p className="mt-1 text-[11px] text-muted">Gross charging revenue, minus the electricity Watty buys to supply your chargers, minus a {/* fee */}5% platform & operations fee, then your contractual {formatPercent(royaltyRate)} share of what remains.</p>
        </div>
      </div>
    </Card>
  );
}
