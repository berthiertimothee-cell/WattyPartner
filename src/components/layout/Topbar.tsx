import Link from "next/link";
import type { User } from "@/lib/types";
import { titleCase } from "@/lib/utils";
import { Avatar } from "../ui";
import { BellIcon, SearchIcon } from "../Icons";
import { Logo } from "./Logo";

export function Topbar({ user, orgName, unreadAlerts }: { user: User; orgName: string; unreadAlerts: number }) {
  const quickTabs = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/partners", label: "Partners" },
    { href: "/sites", label: "Sites" },
    { href: "/incidents", label: "Incidents" },
    { href: "/reports", label: "Reports" },
  ];

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center gap-4 border-b border-white/60 bg-[#fcfffcdd] px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <Link href="/dashboard" className="lg:hidden">
        <Logo size={34} />
      </Link>

      <div className="hidden flex-1 items-center md:flex">
        <div className="flex w-full max-w-4xl items-center gap-3">
          <div className="flex w-full max-w-xl items-center gap-3 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-[0_8px_30px_rgba(128,147,241,0.08)] backdrop-blur">
            <SearchIcon className="h-4 w-4 text-slate-400" />
            <input
              placeholder="Search sites, partners, incidents..."
              className="w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-slate-400"
            />
          </div>
          <nav className="hidden items-center gap-1.5 xl:flex">
            {quickTabs.map((tab) => (
              <Link key={tab.href} href={tab.href} className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-ink">
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-3 md:flex-none">
        <Link
          href="/alerts"
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-slate-500 shadow-sm backdrop-blur transition-all hover:scale-[1.02] hover:bg-white hover:text-ink"
        >
          <BellIcon className="h-5 w-5" />

          {unreadAlerts > 0 && (
            <span className="absolute right-1.5 top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-watty-gradient px-1.5 text-[10px] font-bold text-white shadow-lg">
              {unreadAlerts}
            </span>
          )}
        </Link>

        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/80 px-2.5 py-2 shadow-sm backdrop-blur transition-all hover:bg-white hover:shadow-cardHover"
        >
          <Avatar name={user.name} color={user.avatarColor} size={38} />

          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-sm font-bold tracking-tight text-ink">{user.name}</span>
            <span className="block text-[11px] font-medium text-muted">
              {titleCase(user.role.replace("operator_", ""))} · {orgName}
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
}
