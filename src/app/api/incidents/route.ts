import { getIncidents } from "@/lib/data";
import { ok } from "../_helpers";

export function GET(req: Request) {
  const url = new URL(req.url);
  return ok(
    getIncidents({
      siteId: url.searchParams.get("siteId") ?? undefined,
      partnerId: url.searchParams.get("partnerId") ?? undefined,
      status: (url.searchParams.get("status") as never) ?? undefined,
      openOnly: url.searchParams.get("openOnly") === "true",
    }),
  );
}
