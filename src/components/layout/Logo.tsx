import { cn } from "@/lib/utils";

export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center justify-center", className)} style={{ width: size, height: size }} aria-label="Watty">
      <svg viewBox="0 0 42 32" width={size} height={Math.round((32 / 42) * size)} fill="none" aria-hidden>
        <path d="M3 3L12 29L21 13L30 29L39 3" stroke="#8093F1" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="3" cy="3" r="3.2" fill="#8093F1" />
        <circle cx="12" cy="29" r="3.2" fill="#B388EB" />
        <circle cx="21" cy="13" r="4" fill="#8093F1" />
        <circle cx="30" cy="29" r="3.2" fill="#B388EB" />
        <circle cx="39" cy="3" r="3.2" fill="#8093F1" />
      </svg>
    </span>
  );
}

export function Wordmark({ className, product = "Partner" }: { className?: string; product?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Logo size={34} />
      <span className="flex flex-col leading-none">
        <span className="text-[17px] font-black tracking-[-0.04em] text-ink">Watty</span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{product}</span>
      </span>
    </span>
  );
}
