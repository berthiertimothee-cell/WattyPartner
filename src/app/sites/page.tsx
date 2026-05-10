import Link from "next/link";
import { getOrganization, getRecommendations, getSites } from "@/lib/data";
import { Card, PageHeader, StatusBadge } from "@/components/ui";
import { SiteMap } from "@/components/SiteMap";
import { formatMoney, formatPercent, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SitesPage() {
  const [org, sites, recs] = await Promise.all([getOrganization(), getSites(), getRecommendations({ status: "open" })]);
  const recCountBySite = recs.reduce<Record<string, number>>((m, r) => ((m[r.siteId] = (m[r.siteId] ?? 0) + 1), m), {});

  return (
    <div className="space-y-6">
      <PageHeader title="Sites" subtitle={`${sites.length} charging sites · ${org.name}`} />

      <Card className="card-pad">
        <SiteMap sites={sites} height={300} />
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-5 py-3">Site</th>
                <th className="px-5 py-3">Operator</th>
                <th className="px-5 py-3">Max power</th>
                <th className="px-5 py-3">Price / kWh</th>
                <th className="px-5 py-3">Utilization</th>
                <th className="px-5 py-3">Sessions / day</th>
                <th className="px-5 py-3">Revenue / mo</th>
                <th className="px-5 py-3">Uptime</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((s) => (
                <tr key={s.id} className="table-row hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link href={`/sites/${s.id}`} className="font-medium text-ink hover:text-brand-600">
                      {s.name}
                    </Link>
                    <div className="text-xs text-muted">{s.city}, {s.country}</div>
                  </td>
                  <td className="px-5 py-3 text-muted">{s.operatorName}</td>
                  <td className="px-5 py-3 tabular-nums">{s.maxPowerKw} kW</td>
                  <td className="px-5 py-3 tabular-nums">{formatPrice(s.currentPricePerKwh, s.currency)}</td>
                  <td className="px-5 py-3 tabular-nums">{formatPercent(s.utilizationRate)}</td>
                  <td className="px-5 py-3 tabular-nums">{s.sessionsPerDay}</td>
                  <td className="px-5 py-3 tabular-nums">{formatMoney(s.revenuePerMonth, s.currency)}</td>
                  <td className="px-5 py-3 tabular-nums">{formatPercent(s.uptime, 1)}</td>
                  <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-5 py-3">
                    {recCountBySite[s.id] ? (
                      <Link href={`/sites/${s.id}`} className="badge bg-amber-50 text-warning">{recCountBySite[s.id]} open</Link>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
