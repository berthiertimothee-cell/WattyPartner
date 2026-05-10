import { getIncident, getIncidentSummary, getMaintenanceProvider } from "@/lib/data";
import { notFound, ok } from "../../_helpers";

export function GET(_req: Request, { params }: { params: { id: string } }) {
  const incident = getIncident(params.id);
  if (!incident) return notFound("Incident not found");
  return ok({ incident, provider: getMaintenanceProvider(incident.maintenanceProviderId) ?? null, aiSummary: getIncidentSummary(incident.id) });
}
