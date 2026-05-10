import { NextResponse } from "next/server";
import { getRecommendation, setRecommendationStatus } from "@/lib/data";
import type { RecommendationStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID: RecommendationStatus[] = ["open", "accepted", "dismissed", "exported"];

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const rec = await getRecommendation(params.id);
  if (!rec) return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
  return NextResponse.json(rec);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const status = body?.status as RecommendationStatus | undefined;
  if (!status || !VALID.includes(status)) {
    return NextResponse.json({ error: `status must be one of ${VALID.join(", ")}` }, { status: 400 });
  }
  const updated = await setRecommendationStatus(params.id, status);
  if (!updated) return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
  return NextResponse.json(updated);
}
