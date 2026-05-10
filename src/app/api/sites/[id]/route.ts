import { NextResponse } from "next/server";
import { getSiteDetail } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const detail = await getSiteDetail(params.id);
  if (!detail) return NextResponse.json({ error: "Site not found" }, { status: 404 });
  return NextResponse.json(detail);
}
