import Link from "next/link";
import type { ActivityItem } from "@/lib/data";
import { cn, relativeTime } from "@/lib/utils";
import { CoinIcon, DocIcon, MegaphoneIcon, TruckIcon, WrenchIcon } from "./Icons";

const ICON = {
  incident: WrenchIcon,
  report: CoinIcon,
  deployment: TruckIcon,
  campaign: MegaphoneIcon,
  document: DocIcon,
  alert: WrenchIcon,
} as const;

export function ActivityFeed({ items, partnerNameById }: { items: ActivityItem[]; partnerNameById?: Map<string, string> }) {
  if (!items.length) return <p className="px-5 py-8 text-center text-sm text-muted">No recent activity.</p>;
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((it) => {
        const Icon = ICON[it.kind];
        const row = (
          <div className={cn("flex items-start gap-3 px-5 py-3 sm:px-6", it.href && "transition-colors hover:bg-slate-50")}>
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ink">{it.title}</p>
              <p className="mt-0.5 text-xs text-muted">
                {it.detail ? `${it.detail} · ` : ""}
                {it.partnerId && partnerNameById?.get(it.partnerId) ? `${partnerNameById.get(it.partnerId)} · ` : ""}
                {relativeTime(it.at)}
              </p>
            </div>
          </div>
        );
        return <li key={it.id}>{it.href ? <Link href={it.href}>{row}</Link> : row}</li>;
      })}
    </ul>
  );
}
