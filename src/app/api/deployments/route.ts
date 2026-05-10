import { getDeployments } from "@/lib/data";
import { ok } from "../_helpers";

export function GET(req: Request) {
  const url = new URL(req.url);
  return ok(getDeployments({ partnerId: url.searchParams.get("partnerId") ?? undefined }));
}
