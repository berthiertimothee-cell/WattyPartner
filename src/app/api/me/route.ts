import { getCurrentUser, getOrganization } from "@/lib/data";
import { ok } from "../_helpers";

export const dynamic = "force-static";

export function GET() {
  return ok({ user: getCurrentUser(), organization: getOrganization() });
}
