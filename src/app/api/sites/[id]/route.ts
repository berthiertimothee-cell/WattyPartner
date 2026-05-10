import { getBenchmark, getChargersBySite, getDeploymentForSite, getDocuments, getIncidents, getSite, getSiteSummary } from "@/lib/data";
import { notFound, ok } from "../../_helpers";

export function GET(_req: Request, { params }: { params: { id: string } }) {
  const site = getSite(params.id);
  if (!site) return notFound("Site not found");
  return ok({
    site,
    chargers: getChargersBySite(site.id),
    incidents: getIncidents({ siteId: site.id }),
    benchmark: getBenchmark(site.id) ?? null,
    deployment: getDeploymentForSite(site.id) ?? null,
    documents: getDocuments({ siteId: site.id }),
    aiSummary: getSiteSummary(site.id),
  });
}
