import { getBenchmark, getSites } from "@/lib/data";
import { ok } from "../_helpers";

export function GET(req: Request) {
  const url = new URL(req.url);
  const partnerId = url.searchParams.get("partnerId") ?? undefined;
  const status = (url.searchParams.get("status") as never) ?? undefined;
  return ok(getSites({ partnerId, status }).map((s) => ({ ...s, benchmark: getBenchmark(s.id) ?? null })));
}
