import Link from "next/link";
import type { User } from "@/lib/types";
import { titleCase } from "@/lib/utils";
import { Avatar } from "../ui";
import { BellIcon, SearchIcon } from "../Icons";
import { Logo } from "./Logo";

export function Topbar({ user, orgName, unreadAlerts }: { user: User; orgName: string; unreadAlerts: number }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur sm:px-6 lg:px-8">
      <Link href="/dashboard" className="lg:hidden">
        <Logo size={28} />
      </Link>
      <div className="hidden flex-1 items-center md:flex">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
          <SearchIcon className="h-4 w-4" />
          <span>Search partners, sites, incidents…</span>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-end gap-2 md:flex-none">
        <Link href="/alerts" className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100">
          <BellIcon className="h-5 w-5" />
          {unreadAlerts > 0 && <span className="absolute right-1.5 top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">{unreadAlerts}</span>}
        </Link>
        <Link href="/settings" className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-slate-100">
          <Avatar name={user.name} color={user.avatarColor} size={32} />
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-sm font-medium text-ink">{user.name}</span>
            <span className="block text-[11px] text-muted">{titleCase(user.role.replace("operator_", "")) } · {orgName}</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
