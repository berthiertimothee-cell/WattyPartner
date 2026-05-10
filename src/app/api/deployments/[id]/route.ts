import { getDeployment, getDeploymentSummary } from "@/lib/data";
import { notFound, ok } from "../../_helpers";

export function GET(_req: Request, { params }: { params: { id: string } }) {
  const deployment = getDeployment(params.id);
  if (!deployment) return notFound("Deployment not found");
  return ok({ deployment, aiSummary: getDeploymentSummary(deployment.id) });
}
