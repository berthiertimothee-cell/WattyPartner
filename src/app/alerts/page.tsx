import { getNotifications, getPartners } from "@/lib/data";
import { PageHeader, Card, CardHeader, KpiTile } from "@/components/ui";
import { AlertsList } from "@/components/AlertsList";
import { AlertTriangleIcon, BellIcon, ChartIcon } from "@/components/Icons";
import { titleCase } from "@/lib/utils";
import type { Severity } from "@/lib/types";

const SEVERITY_TITLE: Record<Severity, string> = { critical: "Critical", warning: "Needs attention", opportunity: "Opportunities", info: "For your information" };
const SEVERITY_ORDER: Severity[] = ["critical", "warning", "opportunity", "info"];

export default function AlertsPage() {
  const all = getNotifications();
  const partnerNameById = new Map(getPartners().map((p) => [p.id, p.name]));
  const bySeverity = new Map<Severity, typeof all>();
  for (const s of SEVERITY_ORDER) bySeverity.set(s, all.filter((n) => n.severity === s));
  const unread = all.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title="Alerts Center"
        subtitle="Automatically generated alerts — uptime drops, offline chargers, revenue declines, missing invoices, deployment delays, unresolved incidents, utilization opportunities and partner inactivity."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile label="Open alerts" value={`${all.length}`} icon={<BellIcon className="h-5 w-5" />} sub={`${unread} unread`} />
        <KpiTile label="Critical" value={`${bySeverity.get("critical")?.length ?? 0}`} icon={<AlertTriangleIcon className="h-5 w-5" />} sub="Require action now" />
        <KpiTile label="Needs attention" value={`${bySeverity.get("warning")?.length ?? 0}`} icon={<AlertTriangleIcon className="h-5 w-5" />} />
        <KpiTile label="Opportunities" value={`${bySeverity.get("opportunity")?.length ?? 0}`} icon={<ChartIcon className="h-5 w-5" />} sub="Growth & utilization" />
      </div>

      <div className="mt-6 space-y-6">
        {SEVERITY_ORDER.map((s) => {
          const list = bySeverity.get(s)!;
          if (!list.length) return null;
          return (
            <Card key={s}>
              <CardHeader title={SEVERITY_TITLE[s]} subtitle={`${list.length} alert${list.length === 1 ? "" : "s"}`} icon={<BellIcon className="h-5 w-5" />} />
              <div className="p-2">
                <AlertsList items={list} partnerNameById={partnerNameById} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
