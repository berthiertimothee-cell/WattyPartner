import { getCurrentUser, getDashboardMetrics, getIntegrations, getMaintenanceProviders, getOrganization } from "@/lib/data";
import { PageHeader, Card, CardHeader, KeyValue, Avatar, ActionButton, Badge } from "@/components/ui";
import { BoltIcon, CogIcon, SparkleIcon, UsersIcon, WrenchIcon } from "@/components/Icons";
import * as db from "@/lib/mock-data";
import { titleCase } from "@/lib/utils";

export default function SettingsPage() {
  const org = getOrganization();
  const user = getCurrentUser();
  const providers = getMaintenanceProviders();
  const integrations = getIntegrations();
  const m = getDashboardMetrics();

  return (
    <div>
      <PageHeader title="Settings" subtitle="Workspace, team, royalty defaults, maintenance providers and AI assistant configuration." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Organization" subtitle="Your CPO workspace" icon={<CogIcon className="h-5 w-5" />} action={<ActionButton>Edit</ActionButton>} />
            <div className="card-pad">
              <dl>
                <KeyValue label="Workspace name">{org.name}</KeyValue>
                <KeyValue label="Legal entity">{org.legalName}</KeyValue>
                <KeyValue label="Country">{org.country}</KeyValue>
                <KeyValue label="Reporting currency">{org.currency}</KeyValue>
                <KeyValue label="Partner contact email">{org.contactEmail}</KeyValue>
                <KeyValue label="Network size">{m.totalSitesCount} sites · {m.totalChargersCount} chargers · {m.partnersCount} partners</KeyValue>
              </dl>
            </div>
          </Card>

          <Card>
            <CardHeader title="Team" subtitle="Operator users with access to this workspace" icon={<UsersIcon className="h-5 w-5" />} action={<ActionButton>Invite</ActionButton>} />
            <div className="divide-y divide-slate-100">
              {db.users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                  <Avatar name={u.name} color={u.avatarColor} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{u.name} {u.id === user.id && <span className="text-xs text-muted">· you</span>}</p>
                    <p className="text-[11px] text-muted">{u.email}</p>
                  </div>
                  <Badge tone={u.role === "operator_admin" ? "blue" : u.role === "partner" ? "neutral" : "green"}>{titleCase(u.role.replace("operator_", "operator "))}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Maintenance providers" subtitle="Contractors used for incident dispatch" icon={<WrenchIcon className="h-5 w-5" />} action={<ActionButton>Add provider</ActionButton>} />
            <div className="divide-y divide-slate-100">
              {providers.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-6">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{p.name}</p>
                    <p className="text-[11px] text-muted">{p.regions.join(", ")} · {p.contactEmail} · {p.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums text-ink">~{p.avgResolutionHours}h</p>
                    <p className="text-[11px] text-muted">★ {p.rating.toFixed(1)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="card-pad">
            <h2 className="section-title mb-3">Royalty & billing defaults</h2>
            <dl>
              <KeyValue label="Default royalty share">15%</KeyValue>
              <KeyValue label="Platform & ops fee">5% of gross</KeyValue>
              <KeyValue label="Electricity cost basis">~€0.16 / kWh wholesale</KeyValue>
              <KeyValue label="Statement cadence">Monthly, issued by the 10th</KeyValue>
              <KeyValue label="Payout terms">Net 30 from issue</KeyValue>
            </dl>
            <p className="mt-3 text-[11px] text-muted">Per-partner overrides are set on each partner’s contract.</p>
          </Card>

          <Card className="card-pad">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-white"><SparkleIcon className="h-4 w-4" /></span>
              <h2 className="section-title">AI assistant</h2>
            </div>
            <dl>
              <KeyValue label="Model">partneros-assistant-v1</KeyValue>
              <KeyValue label="Used for">Summaries, explanations, recommendations, drafting</KeyValue>
              <KeyValue label="Never used for">Royalty / financial calculations</KeyValue>
              <KeyValue label="Auto-summaries">Sites, partners, incidents, reports, deployments</KeyValue>
              <KeyValue label="Status"><Badge tone="green">Enabled</Badge></KeyValue>
            </dl>
            <p className="mt-3 text-[11px] text-muted">All metrics shown to partners are computed deterministically; the assistant only narrates and drafts. Swap the model for the Claude or OpenAI API in <code>src/lib/ai.ts</code>.</p>
          </Card>

          <Card className="card-pad">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><BoltIcon className="h-4 w-4" /></span>
              <h2 className="section-title">Integrations</h2>
            </div>
            <ul className="space-y-2 text-sm">
              {integrations.map((integration) => (
                <li key={integration.id} className="rounded-xl border border-slate-100 p-2.5">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-slate-700">{integration.label}</span>
                    <Badge tone={integration.status === "connected" ? "green" : integration.status === "ready" ? "blue" : integration.status === "error" ? "red" : "amber"}>
                      {integration.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted">{integration.description}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-muted">Priorité Q2: HubSpot, Metabase et Site Tracker (timeline terrains) pour unifier CRM, BI et suivi déploiement.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
