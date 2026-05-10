import { NextResponse } from "next/server";
import { markAlertRead } from "@/lib/data";

export const dynamic = "force-dynamic";

// PATCH marks an alert as read.
export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const updated = await markAlertRead(params.id);
  if (!updated) return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  return NextResponse.json(updated);
}
