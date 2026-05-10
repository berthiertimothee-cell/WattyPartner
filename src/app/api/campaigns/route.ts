import { getCampaigns } from "@/lib/data";
import { ok } from "../_helpers";

export function GET(req: Request) {
  const url = new URL(req.url);
  return ok(getCampaigns({ partnerId: url.searchParams.get("partnerId") ?? undefined }));
}
