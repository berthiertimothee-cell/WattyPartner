import Link from "next/link";
import type { BenchmarkRow } from "@/lib/types";
import { GapPill, PositionBadge } from "@/components/ui";
import { formatPercent, formatPrice } from "@/lib/utils";

export function BenchmarkTable({ rows, currency = "EUR" }: { rows: BenchmarkRow[]; currency?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="px-5 py-3">Site</th>
            <th className="px-5 py-3">Our price</th>
            <th className="px-5 py-3">Local avg</th>
            <th className="px-5 py-3">Range</th>
            <th className="px-5 py-3"># Competitors</th>
            <th className="px-5 py-3">Gap</th>
            <th className="px-5 py-3">Utilization</th>
            <th className="px-5 py-3">Position</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.siteId} className="table-row hover:bg-slate-50">
              <td className="px-5 py-3">
                <Link href={`/sites/${r.siteId}`} className="font-medium text-ink hover:text-brand-600">
                  {r.siteName}
                </Link>
                <div className="text-xs text-muted">{r.city}</div>
              </td>
              <td className="px-5 py-3 tabular-nums">{formatPrice(r.ourPrice, currency)}</td>
              <td className="px-5 py-3 tabular-nums">{formatPrice(r.competitorAvg, currency)}</td>
              <td className="px-5 py-3 tabular-nums text-muted">
                {r.competitorMin === null ? "—" : `${formatPrice(r.competitorMin, currency)} – ${formatPrice(r.competitorMax, currency)}`}
              </td>
              <td className="px-5 py-3 tabular-nums">{r.competitorCount}</td>
              <td className="px-5 py-3"><GapPill gapPct={r.gapPct} /></td>
              <td className="px-5 py-3 tabular-nums">{formatPercent(r.utilizationRate)}</td>
              <td className="px-5 py-3"><PositionBadge position={r.position} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
