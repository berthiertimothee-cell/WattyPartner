import { getContracts, getDeployments, getDocuments, getIncidents, getPartner, getPartnerMetrics, getPartnerSummary, getRevenueReports, getSites } from "@/lib/data";
import { notFound, ok } from "../../_helpers";

export function GET(_req: Request, { params }: { params: { id: string } }) {
  const partner = getPartner(params.id);
  if (!partner) return notFound("Partner not found");
  return ok({
    partner,
    metrics: getPartnerMetrics(partner.id),
    aiSummary: getPartnerSummary(partner.id),
    sites: getSites({ partnerId: partner.id }),
    incidents: getIncidents({ partnerId: partner.id }),
    deployments: getDeployments({ partnerId: partner.id }),
    revenueReports: getRevenueReports({ partnerId: partner.id }),
    contracts: getContracts({ partnerId: partner.id }),
    documents: getDocuments({ partnerId: partner.id }),
  });
}
