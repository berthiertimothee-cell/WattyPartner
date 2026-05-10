"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

// Watty mark: a "W" drawn as 5 dots joined by lines, on a Charge Blue → Grid
// Violet → Pulse Pink gradient. Adapted from WattyBrandDesign/WattyLogo.tsx.

type Variant = "default" | "white" | "mono-dark";
type Size = "xs" | "sm" | "md" | "lg" | "xl";

const W_POINTS = [
  { cx: 3, cy: 3 },
  { cx: 12, cy: 29 },
  { cx: 21, cy: 13 },
  { cx: 30, cy: 29 },
  { cx: 39, cy: 3 },
];
const W_LINES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
] as const;

const ICON_SIZE: Record<Size, number> = { xs: 22, sm: 26, md: 30, lg: 40, xl: 64 };
const TEXT_CLASS: Record<Size, string> = { xs: "text-sm", sm: "text-base", md: "text-lg", lg: "text-2xl", xl: "text-4xl" };

export function WattyLogo({
  variant = "default",
  size = "md",
  showWordmark = true,
  subLabel,
  className,
}: {
  variant?: Variant;
  size?: Size;
  showWordmark?: boolean;
  /** small label rendered under the wordmark, e.g. "Partner" */
  subLabel?: string;
  className?: string;
}) {
  const gradientId = useId();
  const px = ICON_SIZE[size];
  const height = Math.round((32 / 42) * px);

  const useGradient = variant === "default";
  const stroke = variant === "white" ? "rgba(255,255,255,0.8)" : variant === "mono-dark" ? "#111827" : `url(#${gradientId})`;
  const dotColors =
    variant === "white"
      ? ["rgba(255,255,255,0.6)", "rgba(255,255,255,0.85)", "#fff", "rgba(255,255,255,0.85)", "rgba(255,255,255,0.6)"]
      : variant === "mono-dark"
        ? ["#111827", "#111827", "#111827", "#111827", "#111827"]
        : ["#8093F1", "#B388EB", "#8093F1", "#B388EB", "#F7AEF8"];
  const textColor = variant === "white" ? "text-white" : "text-ink";

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <svg width={px} height={height} viewBox="0 0 42 32" fill="none" aria-hidden>
        {useGradient && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="42" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#8093F1" />
              <stop offset="50%" stopColor="#B388EB" />
              <stop offset="100%" stopColor="#F7AEF8" />
            </linearGradient>
          </defs>
        )}
        {W_LINES.map(([from, to], i) => (
          <line
            key={i}
            x1={W_POINTS[from].cx}
            y1={W_POINTS[from].cy}
            x2={W_POINTS[to].cx}
            y2={W_POINTS[to].cy}
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ))}
        {W_POINTS.map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r={i === 2 ? 4 : 3} fill={dotColors[i]} />
        ))}
      </svg>
      {showWordmark && (
        <div className="leading-none">
          <span className={cn("font-bold tracking-tightest", TEXT_CLASS[size], textColor)}>watty</span>
          {subLabel && (
            <span className={cn("ml-1.5 font-medium tracking-tight", textColor, "opacity-60", size === "xs" || size === "sm" ? "text-xs" : "text-sm")}>
              {subLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
