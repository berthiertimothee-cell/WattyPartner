import { NextResponse } from "next/server";
import { getRecommendations } from "@/lib/data";
import type { RecommendationStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const siteId = url.searchParams.get("siteId") ?? undefined;
  const status = (url.searchParams.get("status") as RecommendationStatus | null) ?? undefined;
  return NextResponse.json(await getRecommendations({ siteId, status }));
}
