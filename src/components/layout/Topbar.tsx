import Link from "next/link";
import type { User } from "@/lib/types";
import { titleCase } from "@/lib/utils";
import { Avatar } from "../ui";
import { BellIcon, SearchIcon } from "../Icons";
import { Logo } from "./Logo";

export function Topbar({ user, orgName, unreadAlerts }: { user: User; orgName: string; unreadAlerts: number }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/70 bg-[#fcfffcf2] px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex h-16 items-center gap-4">
        <Link href="/dashboard" className="lg:hidden"><Logo size={34} /></Link>
        <div className="hidden flex-1 items-center md:flex">
          <div className="flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
            <SearchIcon className="h-4 w-4 text-slate-400" />
            <input placeholder="Search sites, partners, incidents or CRM tasks" className="w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-slate-400" />
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-500">⌘K</span>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2 md:flex-none">
          <Link href="/dashboard" className="rounded-xl bg-watty-gradient px-3 py-2 text-xs font-bold text-white">Partner</Link>
          <a href="https://github.com/berthiertimothee-cell/WattyPricing" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Pricing</a>
          <Link href="/settings" className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 lg:inline-flex">Integrations</Link>
          <span className="hidden rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-success xl:inline-flex">Data healthy</span>
          <Link href="/alerts" className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-ink"><BellIcon className="h-5 w-5" />{unreadAlerts > 0 && <span className="absolute right-1 top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-watty-gradient px-1.5 text-[10px] font-bold text-white">{unreadAlerts}</span>}</Link>
          <Link href="/settings" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm transition-all hover:bg-slate-50"><Avatar name={user.name} color={user.avatarColor} size={34} /><span className="hidden text-left leading-tight sm:block"><span className="block text-sm font-bold tracking-tight text-ink">{user.name}</span><span className="block text-[11px] font-medium text-muted">{titleCase(user.role.replace("operator_", ""))} · {orgName}</span></span></Link>
        </div>
      </div>
    </header>
  );
}
