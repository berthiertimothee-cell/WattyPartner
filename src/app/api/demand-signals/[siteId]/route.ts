import { NextResponse } from "next/server";
import { getSite } from "@/lib/data";
import { getDemandSignals } from "@/lib/demand-signals";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { siteId: string } }) {
  const site = await getSite(params.siteId);
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });
  return NextResponse.json(await getDemandSignals(site));
}
