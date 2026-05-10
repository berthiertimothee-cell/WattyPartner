import type { AiSummary } from "@/lib/types";
import { relativeTime } from "@/lib/utils";
import { CheckIcon, SparkleIcon } from "./Icons";

/** The AI Partner Assistant summary block — used on dashboard, site, partner, incident and report pages. */
export function AiSummaryCard({ summary, compact = false }: { summary: AiSummary; compact?: boolean }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-start gap-3 border-b border-slate-100 bg-gradient-to-br from-brand-50/70 to-white px-5 py-4 sm:px-6">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
          <SparkleIcon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="section-title">AI summary</h2>
            <span className="badge bg-white text-muted ring-1 ring-slate-200">{summary.model}</span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted">Generated {relativeTime(summary.generatedAt)} · {summary.headline}</p>
        </div>
      </div>
      <div className="card-pad">
        <p className="text-sm leading-relaxed text-ink">{summary.body}</p>
        {!compact && summary.bullets.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {summary.bullets.map((b, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
        {summary.actions.length > 0 && (
          <div className="mt-4 rounded-xl bg-slate-50 p-3.5">
            <div className="stat-label mb-2">Suggested next steps</div>
            <ul className="space-y-1.5">
              {summary.actions.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-3 text-[11px] text-slate-400">AI is used only for summaries, explanations and drafting. All figures are computed deterministically.</p>
      </div>
    </div>
  );
}
