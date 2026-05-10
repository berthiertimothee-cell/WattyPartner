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
      title: "Operations",
      items: [
        { href: "/partners", label: "Partners", icon: UsersIcon },
        { href: "/sites", label: "Sites", icon: PinIcon },
        { href: "/incidents", label: "Incidents", icon: WrenchIcon, badge: openIncidents },
        { href: "/deployments", label: "Deployments", icon: TruckIcon },
      ],
    },
    {
      title: "Growth",
      items: [
        { href: "/revenues", label: "Revenue", icon: CoinIcon },
        { href: "/campaigns", label: "Campaigns", icon: MegaphoneIcon },
        { href: "/reports", label: "Reports", icon: ChartIcon },
        { href: "/documents", label: "Documents", icon: DocIcon },
      ],
    },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 flex-col border-r border-white/60 bg-[linear-gradient(180deg,#FCFFFC_0%,#F7F3FF_100%)] lg:flex">
      <div className="px-5 pb-4 pt-5">
        <div className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_12px_40px_rgba(128,147,241,0.12)] backdrop-blur">
          <Link href="/dashboard">
            <Wordmark />
          </Link>

          <div className="mt-5 overflow-hidden rounded-2xl bg-watty-gradient p-[1px] shadow-glow">
            <div className="rounded-2xl bg-[#ffffffee] px-4 py-3 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-watty-gradient text-white shadow-lg">
                  <BoltIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{orgName}</p>
                  <p className="text-[11px] font-medium text-muted">Partner workspace</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-6">
        {groups.map((g) => (
          <div key={g.title} className="mb-7">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{g.title}</p>
            <ul className="space-y-1.5">
              {g.items.map((it) => {
                const Icon = it.icon;
                const active = isActive(it.href);

                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all duration-200",
                        active
                          ? "bg-watty-gradient text-white shadow-[0_10px_30px_rgba(179,136,235,0.35)]"
                          : "text-slate-600 hover:bg-white hover:text-ink hover:shadow-card",
                      )}
                    >
                      <Icon className={cn("h-[18px] w-[18px]", active ? "text-white" : "text-slate-400 group-hover:text-brand")}/>
                      <span className="flex-1">{it.label}</span>

                      {it.badge ? (
                        <span
                          className={cn(
                            "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                            active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {it.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-4 pt-0">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur transition-all hover:bg-white hover:text-ink",
            isActive("/settings") && "bg-white text-ink shadow-cardHover",
          )}
        >
          <CogIcon className="h-[18px] w-[18px]" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
