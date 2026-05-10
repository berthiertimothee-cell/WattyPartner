"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Wordmark } from "./Logo";
import {
  BellIcon,
  BoltIcon,
  ChartIcon,
  CoinIcon,
  CogIcon,
  DocIcon,
  GridIcon,
  MegaphoneIcon,
  PinIcon,
  TruckIcon,
  UsersIcon,
  WrenchIcon,
} from "../Icons";

type Item = { href: string; label: string; icon: (p: { className?: string }) => JSX.Element; badge?: number };

export function Sidebar({ orgName, openIncidents, unreadAlerts }: { orgName: string; openIncidents: number; unreadAlerts: number }) {
  const pathname = usePathname();
  const groups: { title: string; items: Item[] }[] = [
    {
      title: "Overview",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: GridIcon },
        { href: "/alerts", label: "Alerts Center", icon: BellIcon, badge: unreadAlerts },
      ],
    },
    {
      title: "Network",
      items: [
        { href: "/partners", label: "Partners", icon: UsersIcon },
        { href: "/sites", label: "Sites", icon: PinIcon },
        { href: "/incidents", label: "Incidents", icon: WrenchIcon, badge: openIncidents },
        { href: "/deployments", label: "Deployments", icon: TruckIcon },
      ],
    },
    {
      title: "Business",
      items: [
        { href: "/revenues", label: "Revenue & Royalties", icon: CoinIcon },
        { href: "/campaigns", label: "Campaigns", icon: MegaphoneIcon },
        { href: "/reports", label: "Reports", icon: ChartIcon },
        { href: "/documents", label: "Documents", icon: DocIcon },
      ],
    },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex h-16 items-center px-5">
        <Link href="/dashboard">
          <Wordmark />
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((g) => (
          <div key={g.title} className="mb-5">
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{g.title}</p>
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const Icon = it.icon;
                const active = isActive(it.href);
                return (
                  <li key={it.href}>
                    <Link href={it.href} className={cn("nav-link", active && "nav-link-active")}>
                      <Icon className={cn("h-[18px] w-[18px]", active ? "text-white" : "text-slate-400")} />
                      <span className="flex-1">{it.label}</span>
                      {it.badge ? <span className={cn("badge", active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>{it.badge}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-slate-100 p-3">
        <Link href="/settings" className={cn("nav-link", isActive("/settings") && "nav-link-active")}>
          <CogIcon className={cn("h-[18px] w-[18px]", isActive("/settings") ? "text-white" : "text-slate-400")} />
          <span>Settings</span>
        </Link>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-white">
            <BoltIcon className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-ink">{orgName}</p>
            <p className="text-[10px] text-muted">CPO workspace</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
