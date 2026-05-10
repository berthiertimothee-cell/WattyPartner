import { getCurrentUser, getDashboardMetrics, getMaintenanceProviders, getOrganization } from "@/lib/data";
import { PageHeader, Card, CardHeader, KeyValue, Avatar, ActionButton, Badge } from "@/components/ui";
import { BoltIcon, CogIcon, SparkleIcon, UsersIcon, WrenchIcon } from "@/components/Icons";
import * as db from "@/lib/mock-data";
import { titleCase } from "@/lib/utils";

const DATA_STACK = [
  ["HubSpot CRM", "Partners, companies, tickets, tasks, lifecycle stages", "Ready to map", "amber"],
  ["Metabase", "Revenue, sessions, uptime, charger performance dashboards", "BI ready", "green"],
  ["CSMS / OCPP", "Live station status, connector events, uptime, incidents", "Connected", "green"],
  ["Email / Brevo", "Partner campaigns, onboarding, lifecycle comms", "Connected", "green"],
  ["Accounting", "Royalties, invoices, payouts, partner statements", "CSV / API", "neutral"],
];

const HUBSPOT_FIELDS = [
  ["Partner", "Company", "partner_id, owner, lifecycle_stage"],
  ["Site", "Custom object", "site_id, city, status, csm_owner"],
  ["Incident", "Ticket", "site_id, severity, SLA, provider"],
  ["Follow-up", "Task", "next_best_action, due_date, owner"],
];

export default function SettingsPage() {
  const org = getOrganization();
  const user = getCurrentUser();
  const providers = getMaintenanceProviders();
  const m = getDashboardMetrics();

  return (
    <div>
      <PageHeader title="Settings" subtitle="Workspace, CRM mapping, data health, team and AI assistant configuration." />

      <div className="mb-6 grid gap-3 lg:grid-cols-5">
        {DATA_STACK.map(([name, purpose, status, tone]) => <IntegrationTile key={name} name={name} purpose={purpose} status={status} tone={tone} />)}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Integration control plane" subtitle="Make Watty sit on top of HubSpot for workflow and Metabase for truth/data exploration." icon={<BoltIcon className="h-5 w-5" />} action={<ActionButton>Configure</ActionButton>} />
            <div className="card-pad grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-bold text-ink">HubSpot sync model</p>
                <p className="mt-1 text-xs text-muted">Watty creates the operational layer while HubSpot remains the CRM system of record.</p>
                <div className="mt-4 space-y-2">
                  {HUBSPOT_FIELDS.map(([watty, hs, fields]) => <Mapping key={watty} watty={watty} hs={hs} fields={fields} />)}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-bold text-ink">Metabase data contract</p>
                <p className="mt-1 text-xs text-muted">Operational metrics can be read from Metabase cards or warehouse tables.</p>
                <div className="mt-4 space-y-3 text-sm">
                  <KeyValue label="Cards expected">Revenue, uptime, sessions, incidents, charger status</KeyValue>
                  <KeyValue label="Refresh cadence">Daily for business KPIs · near real-time for incidents</KeyValue>
                  <KeyValue label="Join keys">site_id, partner_id, charger_id, connector_id</KeyValue>
                  <KeyValue label="Data quality gates"><Badge tone="green">Schema checks enabled</Badge></KeyValue>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Organization" subtitle="Your CPO workspace" icon={<CogIcon className="h-5 w-5" />} action={<ActionButton>Edit</ActionButton>} />
            <div className="card-pad"><dl><KeyValue label="Workspace name">{org.name}</KeyValue><KeyValue label="Legal entity">{org.legalName}</KeyValue><KeyValue label="Country">{org.country}</KeyValue><KeyValue label="Reporting currency">{org.currency}</KeyValue><KeyValue label="Partner contact email">{org.contactEmail}</KeyValue><KeyValue label="Network size">{m.totalSitesCount} sites · {m.totalChargersCount} chargers · {m.partnersCount} partners</KeyValue></dl></div>
          </Card>

          <Card>
            <CardHeader title="Team" subtitle="Operator users with access to this workspace" icon={<UsersIcon className="h-5 w-5" />} action={<ActionButton>Invite</ActionButton>} />
            <div className="divide-y divide-slate-100">{db.users.map((u) => <div key={u.id} className="flex items-center gap-3 px-5 py-3.5 sm:px-6"><Avatar name={u.name} color={u.avatarColor} size={36} /><div className="min-w-0 flex-1"><p className="text-sm font-medium text-ink">{u.name} {u.id === user.id && <span className="text-xs text-muted">· you</span>}</p><p className="text-[11px] text-muted">{u.email}</p></div><Badge tone={u.role === "operator_admin" ? "blue" : u.role === "partner" ? "neutral" : "green"}>{titleCase(u.role.replace("operator_", "operator "))}</Badge></div>)}</div>
          </Card>

          <Card>
            <CardHeader title="Maintenance providers" subtitle="Contractors used for incident dispatch" icon={<WrenchIcon className="h-5 w-5" />} action={<ActionButton>Add provider</ActionButton>} />
            <div className="divide-y divide-slate-100">{providers.map((p) => <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-6"><div className="min-w-0"><p className="text-sm font-medium text-ink">{p.name}</p><p className="text-[11px] text-muted">{p.regions.join(", ")} · {p.contactEmail} · {p.phone}</p></div><div className="text-right"><p className="text-sm font-medium tabular-nums text-ink">~{p.avgResolutionHours}h</p><p className="text-[11px] text-muted">★ {p.rating.toFixed(1)}</p></div></div>)}</div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="card-pad"><h2 className="section-title mb-3">Data health</h2><dl><KeyValue label="CRM sync"><Badge tone="amber">Mapping pending</Badge></KeyValue><KeyValue label="BI freshness"><Badge tone="green">Healthy</Badge></KeyValue><KeyValue label="Missing site IDs">3 records</KeyValue><KeyValue label="Unmatched HubSpot companies">7 companies</KeyValue><KeyValue label="Last warehouse refresh">Today · 06:00</KeyValue></dl></Card>
          <Card className="card-pad"><h2 className="section-title mb-3">Royalty & billing defaults</h2><dl><KeyValue label="Default royalty share">15%</KeyValue><KeyValue label="Platform & ops fee">5% of gross</KeyValue><KeyValue label="Electricity cost basis">~€0.16 / kWh wholesale</KeyValue><KeyValue label="Statement cadence">Monthly, issued by the 10th</KeyValue><KeyValue label="Payout terms">Net 30 from issue</KeyValue></dl></Card>
          <Card className="card-pad"><div className="mb-3 flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-white"><SparkleIcon className="h-4 w-4" /></span><h2 className="section-title">AI assistant</h2></div><dl><KeyValue label="Model">partneros-assistant-v1</KeyValue><KeyValue label="Used for">Summaries, workflow routing, drafting, next-best-actions</KeyValue><KeyValue label="Never used for">Royalty / financial calculations</KeyValue><KeyValue label="Status"><Badge tone="green">Enabled</Badge></KeyValue></dl></Card>
        </div>
      </div>
    </div>
  );
}
function IntegrationTile({ name, purpose, status, tone }: { name: string; purpose: string; status: string; tone: string }) { return <div className="card p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-ink">{name}</p><p className="mt-1 text-xs text-muted">{purpose}</p></div><Badge tone={tone as never}>{status}</Badge></div></div>; }
function Mapping({ watty, hs, fields }: { watty: string; hs: string; fields: string }) { return <div className="rounded-xl bg-slate-50 p-3"><div className="flex items-center justify-between text-xs"><span className="font-bold text-ink">{watty}</span><span className="text-muted">→ {hs}</span></div><p className="mt-1 font-mono text-[11px] text-slate-500">{fields}</p></div>; }
