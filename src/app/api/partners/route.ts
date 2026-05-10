import { getPartnerMetrics, getPartners } from "@/lib/data";
import { ok } from "../_helpers";

export function GET() {
  return ok(getPartners().map((p) => ({ ...p, metrics: getPartnerMetrics(p.id) })));
}
