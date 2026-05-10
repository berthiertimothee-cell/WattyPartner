import { Badge, type Tone } from "./ui";
import type { Campaign, Contract, Deployment, Incident, RevenueReport, Site } from "@/lib/types";

function map<T extends string>(v: T, m: Record<T, { label: string; tone: Tone }>) {
  return m[v] ?? { label: v, tone: "neutral" as Tone };
}

export function SiteStatusBadge({ status }: { status: Site["status"] }) {
  const { label, tone } = map(status, {
    active: { label: "Active", tone: "green" },
    maintenance: { label: "Maintenance", tone: "amber" },
    construction: { label: "Construction", tone: "blue" },
    planned: { label: "Planned", tone: "neutral" },
    offline: { label: "Offline", tone: "red" },
  });
  return <Badge tone={tone}>{label}</Badge>;
}

export function ChargerStatusBadge({ status }: { status: import("@/lib/types").Charger["status"] }) {
  const { label, tone } = map(status, {
    available: { label: "Available", tone: "green" },
    charging: { label: "Charging", tone: "blue" },
    faulted: { label: "Faulted", tone: "red" },
    offline: { label: "Offline", tone: "red" },
    maintenance: { label: "Maintenance", tone: "amber" },
  });
  return <Badge tone={tone}>{label}</Badge>;
}

export function IncidentStatusBadge({ status }: { status: Incident["status"] }) {
  const { label, tone } = map(status, {
    open: { label: "Open", tone: "blue" },
    in_progress: { label: "In progress", tone: "blue" },
    waiting_external: { label: "Waiting external provider", tone: "amber" },
    scheduled: { label: "Scheduled", tone: "violet" },
    resolved: { label: "Resolved", tone: "green" },
  });
  return <Badge tone={tone}>{label}</Badge>;
}

export function SeverityLevelBadge({ severity }: { severity: Incident["severity"] }) {
  const { label, tone } = map(severity, {
    low: { label: "Low", tone: "neutral" },
    medium: { label: "Medium", tone: "amber" },
    high: { label: "High", tone: "red" },
  });
  return <Badge tone={tone}>{label}</Badge>;
}

export function ReportStatusBadge({ status }: { status: RevenueReport["status"] }) {
  const { label, tone } = map(status, {
    draft: { label: "Draft", tone: "neutral" },
    issued: { label: "Issued", tone: "blue" },
    paid: { label: "Paid", tone: "green" },
  });
  return <Badge tone={tone}>{label}</Badge>;
}

export function CampaignStatusBadge({ status }: { status: Campaign["status"] }) {
  const { label, tone } = map(status, {
    draft: { label: "Draft", tone: "neutral" },
    scheduled: { label: "Scheduled", tone: "violet" },
    active: { label: "Active", tone: "green" },
    completed: { label: "Completed", tone: "neutral" },
  });
  return <Badge tone={tone}>{label}</Badge>;
}

export function ContractStatusBadge({ status }: { status: Contract["status"] }) {
  const { label, tone } = map(status, {
    active: { label: "Active", tone: "green" },
    expired: { label: "Expired", tone: "neutral" },
    pending_signature: { label: "Pending signature", tone: "amber" },
  });
  return <Badge tone={tone}>{label}</Badge>;
}

export function PartnerStatusBadge({ status }: { status: import("@/lib/types").Partner["status"] }) {
  const { label, tone } = map(status, {
    active: { label: "Active", tone: "green" },
    onboarding: { label: "Onboarding", tone: "blue" },
    churned: { label: "Churned", tone: "red" },
  });
  return <Badge tone={tone}>{label}</Badge>;
}

export function DeploymentStatusBadge({ deployment }: { deployment: Deployment }) {
  if (deployment.progress >= 1) return <Badge tone="green">Live</Badge>;
  return deployment.delayed ? <Badge tone="amber">Delayed</Badge> : <Badge tone="blue">On track</Badge>;
}

export function PositionBadge({ position }: { position: import("@/lib/types").SiteBenchmark["position"] }) {
  const { label, tone } = map(position, {
    underpriced: { label: "Below market", tone: "green" },
    aligned: { label: "Market-aligned", tone: "neutral" },
    overpriced: { label: "Above market", tone: "amber" },
    unknown: { label: "No data", tone: "neutral" },
  });
  return <Badge tone={tone}>{label}</Badge>;
}
