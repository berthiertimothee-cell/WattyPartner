import { getSiteSummary } from "@/lib/data";
import { notFound, ok } from "../../../_helpers";

// AI Partner Assistant — site performance summary.
export function GET(_req: Request, { params }: { params: { id: string } }) {
  const summary = getSiteSummary(params.id);
  if (!summary) return notFound("Site not found");
  return ok(summary);
}
