import { NextResponse } from "next/server";
import { getAlerts, markAllAlertsRead } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const siteId = url.searchParams.get("siteId") ?? undefined;
  const unreadOnly = url.searchParams.get("unreadOnly") === "true";
  return NextResponse.json(await getAlerts({ siteId, unreadOnly }));
}

// Mark all alerts read.
export async function POST() {
  const n = await markAllAlertsRead();
  return NextResponse.json({ markedRead: n });
}
