import { getNotifications } from "@/lib/data";
import { ok } from "../_helpers";

export function GET(req: Request) {
  const url = new URL(req.url);
  return ok(
    getNotifications({
      unreadOnly: url.searchParams.get("unreadOnly") === "true",
      partnerId: url.searchParams.get("partnerId") ?? undefined,
      severity: (url.searchParams.get("severity") as never) ?? undefined,
    }),
  );
}
