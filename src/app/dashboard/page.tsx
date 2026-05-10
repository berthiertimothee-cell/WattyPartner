import Link from "next/link";
import { getAlerts, getBenchmarks, getKpis, getOrganization, getRecommendations, getSites } from "@/lib/data";
import { KpiCards } from "@/components/KpiCards";
import { SiteMap } from "@/components/SiteMap";
import { BenchmarkTable } from "@/components/BenchmarkTable";
import { RecommendationCard } from "@/components/RecommendationCard";
import { AlertsPanel } from "@/components/AlertsPanel";
import { Card, CardHeader, PageHeader, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [org, kpis, sites, benchmarks, recommendations, alerts] = await Promise.all([
    getOrganization(),
    getKpis(),
    getSites(),
    getBenchmarks(),
    getRecommendations({ status: "open" }),
    getAlerts(),
  ]);
  const siteNames = Object.fromEntries(sites.map((s) => [s.id, s.name]));
  const topRec = [...recommendations].sort(
    (a, b) => (b.estimatedImpact.revenueChangePerMonth ?? 0) - (a.estimatedImpact.revenueChangePerMonth ?? 0),
  )[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Pricing & revenue overview · ${sites.length} sites · ${org.country}`}
      />

      <KpiCards kpis={kpis} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Site map" subtitle="Your charging sites and nearby competitors" action={<Link href="/sites" className="text-xs font-medium text-brand-600 hover:underline">View all sites →</Link>} />
          <div className="card-pad">
            <SiteMap sites={sites} height={360} />
          </div>
        </Card>

        <Card>
          <CardHeader title="AI recommendation" subtitle="Highest-impact open action" action={<Link href="/recommendations" className="text-xs font-medium text-brand-600 hover:underline">All →</Link>} />
          <div className="card-pad">
            {topRec ? (
              <RecommendationCard rec={topRec} siteName={siteNames[topRec.siteId]} />
            ) : (
              <EmptyState title="No open recommendations" hint="The engine found nothing actionable right now." />
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Pricing benchmark" subtitle="Your price vs. local competitor averages" action={<Link href="/competitors" className="text-xs font-medium text-brand-600 hover:underline">Details →</Link>} />
          <BenchmarkTable rows={benchmarks} currency={org.currency} />
        </Card>

        <Card>
          <CardHeader title="Alerts" subtitle={`${alerts.filter((a) => !a.read).length} unread`} action={<Link href="/alerts" className="text-xs font-medium text-brand-600 hover:underline">All →</Link>} />
          <div className="card-pad">
            <AlertsPanel alerts={alerts} siteNames={siteNames} limit={6} />
          </div>
        </Card>
      </div>
    </div>
  );
}
