import { NextResponse } from "next/server";
import { getCompetitors } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const siteId = new URL(req.url).searchParams.get("siteId");
  const all = await getCompetitors();
  return NextResponse.json(siteId ? all.filter((c) => c.siteId === siteId) : all);
}
