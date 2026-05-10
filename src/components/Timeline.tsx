import { cn, formatDateTime } from "@/lib/utils";
import type { IncidentEvent } from "@/lib/types";

export function Timeline({ events }: { events: IncidentEvent[] }) {
  const ordered = [...events].sort((a, b) => +new Date(b.at) - +new Date(a.at));
  return (
    <ol className="relative space-y-5 pl-6">
      <span className="absolute left-[7px] top-1.5 bottom-1.5 w-px bg-slate-200" aria-hidden />
      {ordered.map((e, i) => (
        <li key={i} className="relative">
          <span className={cn("absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white", i === 0 ? "bg-brand-600 ring-2 ring-brand-600/20" : "bg-slate-300")} />
          <div className="text-sm text-ink">{e.label}</div>
          <div className="mt-0.5 text-xs text-muted">
            {formatDateTime(e.at)} · {e.by}
          </div>
        </li>
      ))}
    </ol>
  );
}

export type Step = { label: string; status: "done" | "in_progress" | "blocked" | "pending"; meta?: string; note?: string };

/** Vertical milestone tracker used for deployments. */
export function MilestoneTimeline({ steps }: { steps: Step[] }) {
  return (
    <ol className="relative space-y-6 pl-7">
      <span className="absolute left-[9px] top-2 bottom-2 w-px bg-slate-200" aria-hidden />
      {steps.map((s, i) => {
        const cls =
          s.status === "done"
            ? "bg-success border-white"
            : s.status === "in_progress"
              ? "bg-brand-600 border-white ring-2 ring-brand-600/20"
              : s.status === "blocked"
                ? "bg-danger border-white ring-2 ring-danger/15"
                : "bg-white border-slate-300";
        return (
          <li key={i} className="relative">
            <span className={cn("absolute -left-7 top-0.5 h-[18px] w-[18px] rounded-full border-2", cls)} />
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("text-sm font-medium", s.status === "pending" ? "text-slate-400" : "text-ink")}>{s.label}</span>
              {s.meta && <span className="text-xs text-muted">{s.meta}</span>}
              {s.status === "blocked" && <span className="badge bg-red-50 text-danger">Blocked</span>}
              {s.status === "in_progress" && <span className="badge bg-blue-50 text-brand-600">In progress</span>}
            </div>
            {s.note && <p className="mt-1 text-xs text-muted">{s.note}</p>}
          </li>
        );
      })}
    </ol>
  );
}
