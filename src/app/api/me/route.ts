import { NextResponse } from "next/server";
import { getCurrentUser, getOrganization } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const [user, organization] = await Promise.all([getCurrentUser(), getOrganization()]);
  return NextResponse.json({ user, organization });
}
