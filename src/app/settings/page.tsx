import { getCurrentUser, getOrganization, getUsers } from "@/lib/data";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { formatPercent, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

const INTEGRATIONS = [
  { name: "OpenChargeMap", purpose: "Competitor station locations & metadata", env: "OPENCHARGEMAP_API_KEY", status: "Not connected" },
  { name: "Google Maps Places", purpose: "Site/competitor discovery & geocoding", env: "GOOGLE_MAPS_API_KEY", status: "Not connected" },
  { name: "Chargeprice", purpose: "Tariff & price-per-kWh data", env: "CHARGEPRICE_API_KEY", status: "Not connected" },
  { name: "OpenWeather", purpose: "Weather demand signal", env: "OPENWEATHER_API_KEY", status: "Not connected" },
  { name: "Anthropic (Claude)", purpose: "LLM rationale rewriting for recommendations", env: "ANTHROPIC_API_KEY", status: "Not connected" },
  { name: "CSV import", purpose: "Manual upload of sites / competitors / prices", env: "—", status: "Available (manual)" },
];

export default async function SettingsPage() {
  const [org, users, me] = await Promise.all([getOrganization(), getUsers(), getCurrentUser()]);
  const dataSource = process.env.DATA_SOURCE ?? "mock";

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Organization, pricing strategy, team and data sources" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Organization" />
          <div className="card-pad grid grid-cols-2 gap-4 text-sm">
            <Field label="Name" value={org.name} />
            <Field label="Country" value={org.country} />
            <Field label="Currency" value={org.currency} />
            <Field label="Data source mode" value={<span className="badge bg-slate-100 text-slate-700">{dataSource}</span>} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Pricing strategy" subtitle="Inputs to the recommendation engine" />
          <div className="card-pad grid grid-cols-2 gap-4 text-sm">
            <Field label="Target gap above local avg" value={formatPercent(org.settings.targetGapAbove)} />
            <Field label="Low-utilization threshold" value={formatPercent(org.settings.lowUtilizationThreshold)} />
            <Field label="High-utilization threshold" value={formatPercent(org.settings.highUtilizationThreshold)} />
            <Field label="Minimum price step" value={formatPrice(org.settings.minPriceStep, org.currency, 2)} />
            <Field label="Automated price pushes" value={<span className={"badge " + (org.settings.autoApply ? "bg-emerald-50 text-success" : "bg-slate-100 text-slate-600")}>{org.settings.autoApply ? "Enabled" : "Disabled (MVP)"}</span>} />
          </div>
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-muted">
            In the MVP these are read-only. Editing writes back to the organization record and changes engine output on the next refresh.
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Team" subtitle={`${users.length} members`} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Role</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="table-row">
                  <td className="px-5 py-3 font-medium text-ink">{u.name}{u.id === me.id && <span className="ml-2 badge bg-blue-50 text-brand-600">you</span>}</td>
                  <td className="px-5 py-3 text-muted">{u.email}</td>
                  <td className="px-5 py-3 capitalize">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Data sources & integrations" subtitle="Configure API keys in .env to switch from mock to live data" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><th className="px-5 py-3">Provider</th><th className="px-5 py-3">Purpose</th><th className="px-5 py-3">Env var</th><th className="px-5 py-3">Status</th></tr></thead>
            <tbody>
              {INTEGRATIONS.map((i) => (
                <tr key={i.name} className="table-row">
                  <td className="px-5 py-3 font-medium text-ink">{i.name}</td>
                  <td className="px-5 py-3 text-muted">{i.purpose}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{i.env}</td>
                  <td className="px-5 py-3"><span className="badge bg-slate-100 text-slate-600">{i.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="stat-label">{label}</div>
      <div className="mt-1 text-sm font-medium text-ink">{value}</div>
    </div>
  );
}
