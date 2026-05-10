import Link from "next/link";
import { getRecommendations, getSites } from "@/lib/data";
import { Card, PageHeader, Stat } from "@/components/ui";
import { RecommendationCard } from "@/components/RecommendationCard";
import { formatMoney } from "@/lib/utils";
import type { RecommendationStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUSES: { key: RecommendationStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "accepted", label: "Accepted" },
  { key: "dismissed", label: "Dismissed" },
  { key: "exported", label: "Exported" },
];

export default async function RecommendationsPage({ searchParams }: { searchParams: { status?: string } }) {
  const [all, sites] = await Promise.all([getRecommendations(), getSites()]);
  const siteNames = Object.fromEntries(sites.map((s) => [s.id, s.name]));
  const filter: RecommendationStatus | "all" = (searchParams.status as RecommendationStatus | "all" | undefined) ?? "open";
  const list = STATUSES.some((s) => s.key === filter) ? all.filter((r) => filter === "all" || r.status === filter) : all.filter((r) => r.status === "open");
  const sorted = [...list].sort((a, b) => (b.estimatedImpact.revenueChangePerMonth ?? 0) - (a.estimatedImpact.revenueChangePerMonth ?? 0));

  const openRecs = all.filter((r) => r.status === "open");
  const totalUpside = openRecs.map((r) => r.estimatedImpact.revenueChangePerMonth ?? 0).filter((v) => v > 0).reduce((a, b) => a + b, 0);
  const countByType = openRecs.reduce<Record<string, number>>((m, r) => ((m[r.type] = (m[r.type] ?? 0) + 1), m), {});

  return (
    <div className="space-y-6">
      <PageHeader title="Pricing recommendations" subtitle="Rule-based engine output — accept, dismiss or export each action" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="card-pad"><Stat label="Open recommendations" value={openRecs.length} /></Card>
        <Card className="card-pad"><Stat label="Est. revenue opportunity" value={formatMoney(totalUpside, "EUR")} sub="/month if all applied" tone={totalUpside > 0 ? "success" : "default"} /></Card>
        <Card className="card-pad"><Stat label="Price-down actions" value={(countByType.lower_price ?? 0) + (countByType.happy_hour ?? 0)} sub="lower price / happy hour" /></Card>
        <Card className="card-pad"><Stat label="Price-up actions" value={countByType.raise_price ?? 0} sub="raise price" /></Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => {
          const active = (s.key === "open" && !searchParams.status) || searchParams.status === s.key;
          const count = s.key === "all" ? all.length : all.filter((r) => r.status === s.key).length;
          return (
            <Link
              key={s.key}
              href={s.key === "open" ? "/recommendations" : `/recommendations?status=${s.key}`}
              className={"badge px-3 py-1.5 text-sm " + (active ? "bg-brand text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50")}
            >
              {s.label} <span className={active ? "text-white/70" : "text-slate-400"}>· {count}</span>
            </Link>
          );
        })}
      </div>

      {sorted.length === 0 ? (
        <Card className="card-pad"><div className="py-8 text-center text-sm text-muted">No recommendations in this view.</div></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sorted.map((r) => (
            <RecommendationCard key={r.id} rec={r} siteName={siteNames[r.siteId]} />
          ))}
        </div>
      )}
    </div>
  );
}
