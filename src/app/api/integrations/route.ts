import { getIntegrations } from "@/lib/data";
import { ok } from "../_helpers";

export async function GET() {
  return ok(getIntegrations());
}
