import { getRevenueReports, getReportSummary } from "@/lib/data";
import { ok } from "../_helpers";

export function GET(req: Request) {
  const url = new URL(req.url);
  const partnerId = url.searchParams.get("partnerId") ?? undefined;
  const withSummary = url.searchParams.get("summary") === "true";
  const reports = getRevenueReports({ partnerId });
  return ok(withSummary ? reports.map((r) => ({ ...r, aiSummary: getReportSummary(r.id) })) : reports);
}
