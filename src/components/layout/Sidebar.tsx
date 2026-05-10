"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { WattyLogo } from "@/components/WattyLogo";
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
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b border-slate-200 px-5">
        <Link href="/dashboard">
          <WattyLogo size="md" subLabel="Partner" />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {groups.map((g) => (
          <div key={g.title} className="mb-6">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{g.title}</p>
            <ul className="space-y-1">
              {g.items.map((it) => {
                const Icon = it.icon;
                const active = isActive(it.href);

                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className={cn("nav-link", active && "nav-link-active")}
                    >
                      <Icon className="h-4 w-4" />
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

      <div className="border-t border-slate-200 p-4">
        <div className="rounded-lg bg-canvas p-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted">Organization</div>
          <div className="mt-0.5 flex items-center gap-2 text-sm font-medium text-ink">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-[#8093F1] to-[#B388EB] text-white">
              <BoltIcon className="h-3.5 w-3.5" />
            </span>
            {orgName}
          </div>
        </div>
      </div>
    </aside>
  );
}
