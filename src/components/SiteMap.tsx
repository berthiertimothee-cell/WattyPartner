"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Competitor, Site } from "@/lib/types";
import { formatPercent, formatPrice } from "@/lib/utils";

type MapPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  kind: "site" | "competitor";
  detail: string;
  href?: string;
};

// Schematic map: projects lat/lng onto a styled canvas. This intentionally has
// no external tile dependency — set NEXT_PUBLIC_MAPBOX_TOKEN and swap this for a
// real basemap (Mapbox GL / Leaflet) when going live.
export function SiteMap({
  sites,
  competitors = [],
  height = 360,
  highlightSiteId,
}: {
  sites: Site[];
  competitors?: Competitor[];
  height?: number;
  highlightSiteId?: string;
}) {
  const [hover, setHover] = useState<string | null>(null);

  const points: MapPoint[] = useMemo(() => {
    const sp: MapPoint[] = sites.map((s) => ({
      id: s.id,
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      kind: "site",
      detail: `${formatPrice(s.currentPricePerKwh, s.currency)} · ${formatPercent(s.utilizationRate)} util`,
      href: `/sites/${s.id}`,
    }));
    const cp: MapPoint[] = competitors.map((c) => ({
      id: c.id,
      name: c.name,
      lat: c.lat,
      lng: c.lng,
      kind: "competitor",
      detail: `${c.operatorName} · ${c.pricePerKwh === null ? "price n/a" : formatPrice(c.pricePerKwh, c.currency)}`,
    }));
    return [...sp, ...cp];
  }, [sites, competitors]);

  const bounds = useMemo(() => {
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    let minLat = Math.min(...lats);
    let maxLat = Math.max(...lats);
    let minLng = Math.min(...lngs);
    let maxLng = Math.max(...lngs);
    // pad
    const padLat = Math.max((maxLat - minLat) * 0.18, 0.4);
    const padLng = Math.max((maxLng - minLng) * 0.18, 0.4);
    minLat -= padLat;
    maxLat += padLat;
    minLng -= padLng;
    maxLng += padLng;
    return { minLat, maxLat, minLng, maxLng };
  }, [points]);

  const W = 1000;
  const H = Math.round((W * height) / 720);

  function project(lat: number, lng: number) {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * W;
    // invert y because lat increases upward
    const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * H;
    return { x, y };
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-[#eef2f7]" style={{ height }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="xMidYMid slice">
        {/* grid */}
        <defs>
          <pattern id="vy-grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#dbe2ea" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#vy-grid)" />

        {/* faint links from each competitor to its site */}
        {competitors.map((c) => {
          const site = sites.find((s) => s.id === c.siteId);
          if (!site) return null;
          const a = project(site.lat, site.lng);
          const b = project(c.lat, c.lng);
          return <line key={`l-${c.id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#c3cdd9" strokeWidth="1.5" strokeDasharray="4 4" />;
        })}

        {/* competitor markers */}
        {points
          .filter((p) => p.kind === "competitor")
          .map((p) => {
            const { x, y } = project(p.lat, p.lng);
            return (
              <g key={p.id} onMouseEnter={() => setHover(p.id)} onMouseLeave={() => setHover((h) => (h === p.id ? null : h))}>
                <circle cx={x} cy={y} r={hover === p.id ? 8 : 6} fill="#94a3b8" stroke="white" strokeWidth="2" />
              </g>
            );
          })}

        {/* site markers */}
        {points
          .filter((p) => p.kind === "site")
          .map((p) => {
            const { x, y } = project(p.lat, p.lng);
            const isHi = highlightSiteId === p.id;
            const r = hover === p.id || isHi ? 11 : 9;
            return (
              <g key={p.id} onMouseEnter={() => setHover(p.id)} onMouseLeave={() => setHover((h) => (h === p.id ? null : h))}>
                {isHi && <circle cx={x} cy={y} r={20} fill="#1E4ED8" opacity="0.12" />}
                <circle cx={x} cy={y} r={r} fill="#0B1F4D" stroke="white" strokeWidth="3" />
                <circle cx={x} cy={y} r={3} fill="white" />
              </g>
            );
          })}
      </svg>

      {/* hover tooltip */}
      {hover && (() => {
        const p = points.find((x) => x.id === hover);
        if (!p) return null;
        const { x, y } = project(p.lat, p.lng);
        const left = `${(x / W) * 100}%`;
        const top = `${(y / H) * 100}%`;
        const inner = (
          <div className="pointer-events-none -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-cardHover">
            <div className="text-xs font-semibold text-ink">{p.name}</div>
            <div className="text-[11px] text-muted">{p.detail}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">{p.kind === "site" ? "Your site" : "Competitor"}</div>
          </div>
        );
        return (
          <div className="absolute" style={{ left, top }}>
            {p.href ? <Link href={p.href} className="pointer-events-auto">{inner}</Link> : inner}
          </div>
        );
      })()}

      {/* legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-4 rounded-lg bg-white/90 px-3 py-1.5 text-[11px] text-muted shadow-card backdrop-blur">
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-brand" /> Your sites</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-400" /> Competitors</span>
      </div>
      <div className="absolute right-3 top-3 rounded-lg bg-white/90 px-2.5 py-1 text-[10px] uppercase tracking-wide text-slate-400 shadow-card">Schematic map</div>
    </div>
  );
}
