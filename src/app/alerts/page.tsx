import { getAlerts, getSites } from "@/lib/data";
import { Card, CardHeader, PageHeader, Stat } from "@/components/ui";
import { AlertsPanel } from "@/components/AlertsPanel";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const [alerts, sites] = await Promise.all([getAlerts(), getSites()]);
  const siteNames = Object.fromEntries(sites.map((s) => [s.id, s.name]));
  const unread = alerts.filter((a) => !a.read).length;
  const byType = (t: string) => alerts.filter((a) => a.type === t).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Alerts" subtitle="Pricing, competitor and demand alerts across your portfolio" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="card-pad"><Stat label="Total alerts" value={alerts.length} sub={`${unread} unread`} /></Card>
        <Card className="card-pad"><Stat label="Pricing alerts" value={byType("site_overpriced") + byType("site_underpriced")} sub="over / under priced" /></Card>
        <Card className="card-pad"><Stat label="Competitor moves" value={byType("competitor_price_change")} sub="price changes detected" /></Card>
        <Card className="card-pad"><Stat label="Opportunities" value={byType("revenue_opportunity") + byType("high_demand_window")} sub="revenue / demand" tone="success" /></Card>
      </div>

      <Card>
        <CardHeader title="Alert feed" subtitle="Newest first" />
        <div className="card-pad">
          <AlertsPanel alerts={alerts} siteNames={siteNames} />
        </div>
      </Card>
    </div>
  );
}
