import Link from "next/link";
import type { User } from "@/lib/types";

export function Topbar({ user, orgName, unreadAlerts }: { user: User; orgName: string; unreadAlerts: number }) {
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur lg:px-10">
      <div className="flex items-center gap-3">
        <span className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">V</span>
        <div className="text-sm text-muted">
          <span className="font-medium text-ink">{orgName}</span>
          <span className="mx-2 text-slate-300">·</span>
          <span>Pricing & Revenue Workspace</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/alerts" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Alerts">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5 2 6H4c.5-1 2-2 2-6Z" />
            <path d="M10 19a2 2 0 0 0 4 0" />
          </svg>
          {unreadAlerts > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
              {unreadAlerts}
            </span>
          )}
        </Link>
        <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 py-1.5 pl-1.5 pr-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">{initials}</span>
          <div className="leading-tight">
            <div className="text-xs font-semibold text-ink">{user.name}</div>
            <div className="text-[11px] capitalize text-muted">{user.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
