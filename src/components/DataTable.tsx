import { cn } from "@/lib/utils";

export type DataTableDensity = "comfortable" | "compact";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  sticky?: boolean;
  align?: "left" | "right" | "center";
  render: (row: T) => React.ReactNode;
};

export function DataTable<T>({
  rows,
  columns,
  getRowKey,
  density = "comfortable",
  emptyTitle = "No results",
  emptyDescription = "Try changing your filters or search query.",
}: {
  rows: T[];
  columns: DataTableColumn<T>[];
  getRowKey: (row: T) => string;
  density?: DataTableDensity;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const cellPad = density === "compact" ? "px-4 py-2" : "px-4 py-3";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {rows.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">⌕</div>
          <h3 className="text-sm font-bold text-ink">{emptyTitle}</h3>
          <p className="mt-1 max-w-sm text-sm text-muted">{emptyDescription}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
              <tr>
                <th className={cn("w-10", cellPad)}><input type="checkbox" aria-label="Select all rows" /></th>
                {columns.map((column) => (
                  <th key={column.key} className={cn(cellPad, column.align === "right" && "text-right", column.align === "center" && "text-center", column.sticky && "sticky left-10 z-20 bg-slate-50/95", column.className)}>
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={getRowKey(row)} className="border-t border-slate-100 transition-colors hover:bg-slate-50/80">
                  <td className={cn(cellPad, "align-middle")}><input type="checkbox" aria-label="Select row" /></td>
                  {columns.map((column) => (
                    <td key={column.key} className={cn(cellPad, "align-middle", column.align === "right" && "text-right", column.align === "center" && "text-center", column.sticky && "sticky left-10 z-10 bg-white/95 backdrop-blur", column.className)}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function FilterBar({ searchPlaceholder = "Search...", children }: { searchPlaceholder?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-[280px] flex-1 items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400">{searchPlaceholder}</div>
        {children}
      </div>
    </div>
  );
}

export function SavedView({ label, count, active }: { label: string; count: number | string; active?: boolean }) {
  return <button className={cn("rounded-2xl border px-4 py-3 text-left transition-all", active ? "border-brand bg-brand text-white" : "border-slate-200 bg-white hover:border-brand/40 hover:shadow-sm")}><div className={cn("text-[11px] font-bold uppercase tracking-wide", active ? "text-white/70" : "text-muted")}>{label}</div><div className="mt-1 text-xl font-black tabular-nums">{count}</div></button>;
}

export function DensityToggle({ density }: { density: DataTableDensity }) {
  return <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1"><span className={cn("rounded-lg px-2.5 py-1 text-xs font-bold", density === "comfortable" ? "bg-slate-100 text-ink" : "text-slate-500")}>Comfort</span><span className={cn("rounded-lg px-2.5 py-1 text-xs font-bold", density === "compact" ? "bg-slate-100 text-ink" : "text-slate-500")}>Compact</span></div>;
}
