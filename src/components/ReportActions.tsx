"use client";

import type { Report } from "@/lib/types";

export function ReportActions({ report }: { report: Report }) {
  function exportJson() {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voltyield-report-${report.periodStart}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="flex items-center gap-2">
      <button className="btn-secondary" onClick={() => window.print()}>Print / PDF</button>
      <button className="btn-primary" onClick={exportJson}>Export JSON</button>
    </div>
  );
}
