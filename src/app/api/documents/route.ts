import { getContracts, getDocuments } from "@/lib/data";
import { ok } from "../_helpers";

export function GET(req: Request) {
  const url = new URL(req.url);
  return ok({
    documents: getDocuments({
      partnerId: url.searchParams.get("partnerId") ?? undefined,
      siteId: url.searchParams.get("siteId") ?? undefined,
      kind: (url.searchParams.get("kind") as never) ?? undefined,
    }),
    contracts: getContracts({ partnerId: url.searchParams.get("partnerId") ?? undefined }),
  });
}
