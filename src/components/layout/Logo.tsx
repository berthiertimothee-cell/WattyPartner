import { cn } from "@/lib/utils";

/** Watty mark — a lightning bolt in a rounded square, royal-blue. */
export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center justify-center rounded-xl bg-brand text-white", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62} fill="currentColor" aria-hidden>
        <path d="M13.4 2 5 13.2c-.4.5 0 1.2.6 1.2H11l-1 7.2c-.1.8.9 1.2 1.4.6L19 10.6c.4-.5 0-1.2-.6-1.2H13l1.7-6.7c.2-.8-.8-1.3-1.3-.7Z" />
      </svg>
    </span>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <Logo size={28} />
      <span className="flex flex-col leading-none">
        <span className="text-sm font-semibold tracking-tight text-ink">PartnerOS</span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted">by Watty</span>
      </span>
    </span>
  );
}
