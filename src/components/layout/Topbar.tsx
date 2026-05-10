import Link from "next/link";
import type { User } from "@/lib/types";
import { titleCase } from "@/lib/utils";
import { Avatar } from "../ui";
import { BellIcon, SearchIcon } from "../Icons";
import { Wordmark } from "./Logo";

export function Topbar({ user, unreadAlerts }: { user: User; orgName: string; unreadAlerts: number }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-[#FCFFFCF2] px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex h-16 items-center gap-4">
        <Link href="/dashboard" className="shrink-0">
          <Wordmark product="Partner" />
        </Link>

        <div className="hidden flex-1 items-center md:flex">
          <div className="flex w-full max-w-xl items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
            <SearchIcon className="h-4 w-4 text-slate-400" />
            <input placeholder="Search sites, partners or incidents" className="w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-slate-400" />
            <span className="rounded-md bg-slate-100 px-1.5 py-1 text-[10px] font-bold text-slate-500">⌘K</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/dashboard" className="rounded-xl bg-brand px-3 py-2 text-xs font-bold text-white">Partner</Link>
          <a href="https://github.com/berthiertimothee-cell/WattyPricing" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Pricing</a>

          <button className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50">
            <BellIcon className="h-5 w-5" />
            {unreadAlerts > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                {Math.min(unreadAlerts, 9)}
              </span>
            )}
          </button>

          <Link href="/settings" className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm hover:bg-slate-50">
            <Avatar name={user.name} color={user.avatarColor} size={32} />
            <span className="hidden text-left sm:block">
              <span className="block text-xs font-bold text-ink">{user.name}</span>
              <span className="block text-[11px] text-muted">{titleCase(user.role.replace("operator_", ""))}</span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
