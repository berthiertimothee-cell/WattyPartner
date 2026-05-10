import { cn } from "@/lib/utils";

/** Watty mark — connected charging dots, inspired by the brand identity. */
export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  const dot = size * 0.18;
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-2xl bg-watty-gradient shadow-glow ring-1 ring-white/70",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label="Watty"
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.85),transparent_24%)]" />
      <svg viewBox="0 0 48 48" width={size * 0.78} height={size * 0.78} fill="none" aria-hidden className="relative">
        <path d="M14 29C20.5 16.8 28.5 34.2 35 19" stroke="white" strokeWidth="4.2" strokeLinecap="round" />
        <circle cx="13" cy="30" r="5.2" fill="#FCFFFC" />
        <circle cx="24" cy="23" r="5.2" fill="#FCFFFC" fillOpacity="0.92" />
        <circle cx="36" cy="18" r="5.2" fill="#FCFFFC" />
      </svg>
      <span className="sr-only" style={{ width: dot, height: dot }}>Watty</span>
    </span>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <Logo size={36} />
      <span className="flex flex-col leading-none">
        <span className="text-[17px] font-black tracking-[-0.04em] text-ink">Watty</span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Partner</span>
      </span>
    </span>
  );
}
