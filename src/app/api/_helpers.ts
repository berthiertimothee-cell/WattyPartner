import { NextResponse } from "next/server";

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}
export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}
