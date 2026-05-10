import { getDashboardMetrics, getNotifications, getRecentActivity } from "@/lib/data";
import { ok } from "../_helpers";

export function GET() {
  return ok({ metrics: getDashboardMetrics(), alerts: getNotifications().slice(0, 8), activity: getRecentActivity(10) });
}
