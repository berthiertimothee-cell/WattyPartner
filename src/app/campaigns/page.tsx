import Link from "next/link";
import { getCampaigns, getPartner, getSite } from "@/lib/data";
import { PageHeader, Card, CardHeader, KpiTile, ActionButton, Badge } from "@/components/ui";
import { CampaignStatusBadge } from "@/components/StatusBadge";
import { MegaphoneIcon, PlusIcon } from "@/components/Icons";
import { formatDate, formatMoney, formatNumber, formatPercent, titleCase } from "@/lib/utils";
import type { Campaign } from "@/lib/types";

const TYPE_LABEL: Record<Campaign["type"], string> = {
  promo_code: "Promo code",
  session_discount: "Session discount",
  onboarding: "Onboarding",
  reopening: "Reopening",
  retailer: "Retailer",
  fleet: "Fleet",
};

export default function CampaignsPage() {
  const campaigns = getCampaigns();
  const active = campaigns.filter((c) => c.status === "active");
  const sessionsGenerated = campaigns.reduce((n, c) => n + c.sessionsGenerated, 0);
  const redemptions = campaigns.reduce((n, c) => n + c.promoRedemptions, 0);
  const budget = campaigns.reduce((n, c) => n + c.budgetEur, 0);

  return (
    <div>
      <PageHeader
        title="Marketing campaigns"
        subtitle="Launch promo codes, charging discounts, onboarding, reopening, retailer and fleet campaigns — and track sessions generated, promo usage and estimated uplift."
        actions={<ActionButton variant="primary"><PlusIcon className="h-4 w-4" /> New campaign</ActionButton>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile label="Active campaigns" value={`${active.length}`} icon={<MegaphoneIcon className="h-5 w-5" />} sub={`${campaigns.filter((c) => c.status === "scheduled").length} scheduled · ${campaigns.filter((c) => c.status === "draft").length} draft`} />
        <KpiTile label="Sessions generated" value={formatNumber(sessionsGenerated)} icon={<MegaphoneIcon className="h-5 w-5" />} sub="Across all campaigns" />
        <KpiTile label="Promo redemptions" value={formatNumber(redemptions)} icon={<MegaphoneIcon className="h-5 w-5" />} sub={`${sessionsGenerated ? formatPercent(redemptions / sessionsGenerated) : "—"} of sessions used a code`} />
        <KpiTile label="Total budget" value={formatMoney(budget)} icon={<MegaphoneIcon className="h-5 w-5" />} sub="Committed across campaigns" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        {campaigns.map((c) => {
          const partner = getPartner(c.partnerId);
          const siteNames = c.siteIds.map((id) => getSite(id)?.name).filter(Boolean) as string[];
          return (
            <Card key={c.id} className="card-pad">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{c.name}</p>
                  <p className="mt-0.5 text-xs text-muted">{partner && <Link href={`/partners/${partner.id}`} className="hover:text-brand-600">{partner.name}</Link>} · {TYPE_LABEL[c.type]}</p>
                </div>
                <CampaignStatusBadge status={c.status} />
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                <Badge tone="neutral">{formatDate(c.startsAt)} → {formatDate(c.endsAt)}</Badge>
                {c.promoCode && <Badge tone="blue">Code: {c.promoCode}</Badge>}
                {c.discountPct != null && <Badge tone="violet">{c.discountPct >= 1 ? "Free charging" : `${Math.round(c.discountPct * 100)}% off`}</Badge>}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <Mini label="Sessions" value={formatNumber(c.sessionsGenerated)} />
                <Mini label="Redemptions" value={formatNumber(c.promoRedemptions)} />
                <Mini label={c.status === "completed" || c.status === "active" ? "Est. uplift" : "Target uplift"} value={formatPercent(c.estimatedUpliftPct)} />
              </div>

              <p className="mt-3 truncate text-[11px] text-muted">{siteNames.length === 1 ? siteNames[0] : `${siteNames.length} sites`}{siteNames.length > 1 ? ` · ${siteNames.join(", ")}` : ""} · budget {formatMoney(c.budgetEur)}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums text-ink">{value}</div>
    </div>
  );
}
