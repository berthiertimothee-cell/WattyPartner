// PartnerOS — AI Partner Assistant logic.
//
// In production this module calls an LLM (Claude / OpenAI) with a structured
// prompt built from *already-computed* metrics. The model is used ONLY for:
//   - summarising site & partner performance
//   - explaining revenue changes
//   - drafting partner communications
//   - suggesting next actions
// All numbers are computed deterministically upstream and passed in — the LLM
// never does arithmetic. For the MVP we ship a deterministic template engine
// that mirrors the prompt contract, so the UI is fully functional offline and
// the swap to a real model is a single function body.

import type {
  AiSummary,
  Deployment,
  Incident,
  Partner,
  RevenueReport,
  Site,
  SiteBenchmark,
} from "./types";
import { formatMoney, formatMonth, formatPercent, formatSignedPercent, mean, titleCase } from "./utils";

export const AI_MODEL_ID = "partneros-assistant-v1"; // swap for "claude-sonnet-4-6" etc.

function pct1(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

function trailingDelta(series: { sessions: number }[]): number | null {
  if (series.length < 3) return null;
  const lastVal = series[series.length - 1].sessions;
  const prior = mean(series.slice(0, -1).map((m) => m.sessions));
  if (!prior) return null;
  return (lastVal - prior) / prior;
}

function monthOverMonth(series: { revenueEur: number }[]): number | null {
  if (series.length < 2) return null;
  const a = series[series.length - 2].revenueEur;
  const b = series[series.length - 1].revenueEur;
  if (!a) return null;
  return (b - a) / a;
}

// ---------------------------------------------------------------------------
// Site summary
// ---------------------------------------------------------------------------

export function summariseSite(site: Site, benchmark?: SiteBenchmark, openIncidents: Incident[] = []): AiSummary {
  const bullets: string[] = [];
  const actions: string[] = [];
  let body: string;

  if (!site.monthly.length) {
    const goLive = site.expectedGoLive ? ` Expected go-live ${new Date(site.expectedGoLive).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}.` : "";
    body = `${site.name} is not yet operational — it's currently ${titleCase(site.status)}.${goLive} Once live, this summary will track sessions, uptime, revenue and competitor positioning.`;
    bullets.push(`Status: ${titleCase(site.status)}`, `Planned: ${site.chargerCount || "TBD"} chargers`);
    actions.push("Share the deployment timeline with the partner");
    return makeSummary(site.organizationId, "site", site.id, `${site.name}: deployment in progress`, body, bullets, actions);
  }

  const m = site.monthly[site.monthly.length - 1];
  const sessDelta = trailingDelta(site.monthly);
  const utilization = benchmark?.ourUtilizationPct;
  const sentence1 =
    sessDelta == null
      ? `Your ${site.name} location handled ${m.sessions.toLocaleString("en-US")} charging sessions in ${formatMonth(m.month)}.`
      : `Your ${site.name} location generated ${sessDelta >= 0 ? "+" : ""}${(sessDelta * 100).toFixed(0)}% ${sessDelta >= 0 ? "more" : "fewer"} charging sessions this month (${m.sessions.toLocaleString("en-US")} in ${formatMonth(m.month)}).`;
  const sentence2 = `Uptime ${m.uptimePct >= 0.97 ? "is healthy at" : m.uptimePct >= 0.92 ? "sits at" : "dipped to"} ${pct1(m.uptimePct)}.`;
  let sentence3 = "";
  if (benchmark && benchmark.competitors.length) {
    const avgComp = mean(benchmark.competitors.map((c) => c.priceEurKwh))!;
    if (benchmark.position === "underpriced") sentence3 = `Competitor pricing nearby (~${formatMoney(avgComp, "EUR")}/kWh average) remains higher than your ${formatMoney(benchmark.ourPriceEurKwh, "EUR")}/kWh, so you're well positioned on price.`;
    else if (benchmark.position === "overpriced") sentence3 = `Your price (${formatMoney(benchmark.ourPriceEurKwh, "EUR")}/kWh) sits above the local average (~${formatMoney(avgComp, "EUR")}/kWh) — worth reviewing.`;
    else sentence3 = `Your price is roughly in line with nearby networks (~${formatMoney(avgComp, "EUR")}/kWh).`;
  }
  const sentence4 = openIncidents.length
    ? `${openIncidents.length === 1 ? "One maintenance incident remains open" : `${openIncidents.length} maintenance incidents remain open`}${openIncidents.some((i) => i.etaAt) ? ", with an ETA already communicated." : "."}`
    : "No open maintenance incidents.";

  body = [sentence1, sentence2, sentence3, sentence4].filter(Boolean).join(" ");

  bullets.push(`Sessions: ${m.sessions.toLocaleString("en-US")}/month${sessDelta != null ? ` (${formatSignedPercent(sessDelta, 0)} vs trailing avg)` : ""}`);
  bullets.push(`Revenue: ${formatMoney(m.revenueEur, "EUR")} this month · ${formatMoney(m.avgPriceEurKwh, "EUR")}/kWh`);
  bullets.push(`Uptime: ${pct1(m.uptimePct)}${m.uptimePct < 0.95 ? " — below target" : ""}`);
  if (utilization != null) bullets.push(`Utilization: ~${pct1(utilization)}${benchmark && utilization < mean(benchmark.competitors.map((c) => c.estimatedUtilizationPct))! ? " — below nearby competitors" : ""}`);
  if (openIncidents.length) bullets.push(`Open incidents: ${openIncidents.map((i) => i.title).slice(0, 2).join("; ")}`);

  if (m.uptimePct < 0.95) actions.push("Prioritise the open incident to recover uptime");
  if (utilization != null && benchmark && utilization < 0.2) actions.push("Consider a reopening or local awareness campaign — utilization is low");
  if (sessDelta != null && sessDelta > 0.1) actions.push("Flag the growth trend to the partner in the next review");
  actions.push(`Send the ${formatMonth(m.month)} site summary to the partner`);

  return makeSummary(site.organizationId, "site", site.id, headlineForSite(site, m, sessDelta), body, bullets, actions);
}

function headlineForSite(site: Site, m: Site["monthly"][number], sessDelta: number | null): string {
  const parts: string[] = [];
  if (sessDelta != null) parts.push(`${formatSignedPercent(sessDelta, 0)} sessions`);
  parts.push(`uptime ${pct1(m.uptimePct)}`);
  return `${shortName(site.name)}: ${parts.join(", ")}`;
}
function shortName(name: string): string {
  return name.split("—").pop()!.trim() || name;
}

// ---------------------------------------------------------------------------
// Partner summary
// ---------------------------------------------------------------------------

export function summarisePartner(partner: Partner, partnerSites: Site[], openIncidents: Incident[], lastContactDays: number, latestReport?: RevenueReport): AiSummary {
  const liveSites = partnerSites.filter((s) => s.monthly.length);
  const totalRevenue = liveSites.reduce((sum, s) => sum + s.revenuePerMonthEur, 0);
  const avgUptime = mean(liveSites.map((s) => s.uptimePct));
  const bullets: string[] = [];
  const actions: string[] = [];

  const sentences: string[] = [];
  sentences.push(`${partner.name} operates ${partnerSites.length} site${partnerSites.length === 1 ? "" : "s"} with you (${liveSites.length} live), generating roughly ${formatMoney(totalRevenue, "EUR")}/month in charging revenue.`);
  if (avgUptime != null) sentences.push(`Network uptime across their sites averages ${pct1(avgUptime)}.`);
  if (latestReport) sentences.push(`Their ${formatMonth(latestReport.month)} royalty statement is ${formatMoney(latestReport.royaltyEur, "EUR")} (${formatPercent(partner.royaltyRate)} share)${latestReport.status === "issued" ? ", issued and awaiting payment" : latestReport.status === "paid" ? ", paid" : ""}.`);
  if (openIncidents.length) sentences.push(`${openIncidents.length} maintenance incident${openIncidents.length === 1 ? "" : "s"} ${openIncidents.length === 1 ? "is" : "are"} open across their sites.`);
  if (lastContactDays >= 30) sentences.push(`This partner has not received logged communication in ${lastContactDays} days — a check-in is overdue.`);

  const body = sentences.join(" ");

  bullets.push(`${partnerSites.length} sites · ${liveSites.length} live · ${liveSites.reduce((n, s) => n + s.chargerCount, 0)} chargers`);
  bullets.push(`~${formatMoney(totalRevenue, "EUR")}/month revenue${avgUptime != null ? ` · ${pct1(avgUptime)} avg uptime` : ""}`);
  if (latestReport) bullets.push(`Latest royalty: ${formatMoney(latestReport.royaltyEur, "EUR")} (${formatMonth(latestReport.month)})`);
  if (openIncidents.length) bullets.push(`Open incidents: ${openIncidents.length}`);
  bullets.push(`Last contact: ${lastContactDays}d ago`);

  if (lastContactDays >= 30) actions.push(`Schedule a check-in with ${partner.contactName}`);
  if (openIncidents.length) actions.push("Send an incident status update to the partner");
  if (partner.status === "onboarding") actions.push("Complete onboarding: signed contract, portal access, first report");
  actions.push("Generate the monthly partner report");

  return makeSummary(partner.organizationId, "partner", partner.id, `${partner.name}: ${formatMoney(totalRevenue, "EUR")}/mo${avgUptime != null ? `, ${pct1(avgUptime)} uptime` : ""}`, body, bullets, actions);
}

// ---------------------------------------------------------------------------
// Incident summary
// ---------------------------------------------------------------------------

export function summariseIncident(incident: Incident, siteName: string, providerName?: string): AiSummary {
  const sentences: string[] = [];
  sentences.push(`${siteName}: ${incident.title.toLowerCase().startsWith(siteName.toLowerCase()) ? incident.title : incident.title}.`);
  sentences.push(`Status is ${titleCase(incident.status)}${providerName ? `, assigned to ${providerName}` : ""}.`);
  if (incident.category === "cable_theft" || incident.category === "vandalism") sentences.push("This is a vandalism / cable-theft case; a police report has typically been filed and an insurance claim opened.");
  if (incident.etaAt) sentences.push(`Estimated resolution: ${new Date(incident.etaAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long" })}.`);
  if (incident.resolvedAt) sentences.push(`Resolved on ${new Date(incident.resolvedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long" })}.`);
  else sentences.push(`SLA target: ${new Date(incident.slaDueAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long" })}.`);

  const bullets = [
    `Category: ${titleCase(incident.category)} · Severity: ${titleCase(incident.severity)}`,
    `Opened: ${new Date(incident.openedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`,
    incident.resolvedAt ? `Resolved: ${new Date(incident.resolvedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}` : `ETA: ${incident.etaAt ? new Date(incident.etaAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "pending"}`,
    `Timeline: ${incident.timeline.length} updates`,
  ];
  const actions = incident.resolvedAt
    ? ["Confirm the partner was notified of the resolution", "Add a closing note to the repair history"]
    : ["Send a status update to the partner with the current ETA", "Confirm parts/dispatch with the maintenance provider"];

  return makeSummary(incident.organizationId, "incident", incident.id, `${shortName(siteName)}: ${titleCase(incident.status)} — ${titleCase(incident.category)}`, sentences.join(" "), bullets, actions);
}

// ---------------------------------------------------------------------------
// Monthly report summary / revenue explanation
// ---------------------------------------------------------------------------

export function summariseReport(report: RevenueReport, partner: Partner, sitesById: Map<string, Site>): AiSummary {
  const sentences: string[] = [];
  sentences.push(`${formatMonth(report.month)} statement for ${partner.name}: ${formatMoney(report.grossRevenueEur, "EUR")} gross charging revenue across ${report.siteIds.length} site${report.siteIds.length === 1 ? "" : "s"}.`);
  sentences.push(`After ${formatMoney(report.energyCostEur, "EUR")} electricity supply cost and a ${formatMoney(report.platformFeeEur, "EUR")} platform fee, the partner's ${formatPercent(partner.royaltyRate)} revenue share comes to ${formatMoney(report.royaltyEur, "EUR")}.`);
  if (report.discrepancy?.detected) sentences.push(`Note: ${report.discrepancy.note}`);
  sentences.push(report.status === "paid" ? "This statement has been paid." : report.status === "issued" ? "This statement has been issued and is awaiting payment." : "This statement is still in draft.");

  const bullets = report.lines.map((l) => `${l.label}: ${formatMoney(l.amountEur, "EUR")}`);
  const actions = report.status === "draft" ? ["Review and issue the statement", "Attach the detailed monthly report PDF"] : report.discrepancy?.detected ? ["Brief the partner on the flagged variance before the statement lands", "Confirm the service credit was applied"] : ["Confirm payment status", "Archive the statement in the partner's documents"];

  return makeSummary(report.organizationId, "monthly_report", report.id, `${partner.name} ${formatMonth(report.month)}: ${formatMoney(report.royaltyEur, "EUR")} royalty`, sentences.join(" "), bullets, actions);
}

// ---------------------------------------------------------------------------
// Deployment summary
// ---------------------------------------------------------------------------

export function summariseDeployment(dep: Deployment): AiSummary {
  const done = dep.milestones.filter((m) => m.status === "done").length;
  const current = dep.milestones.find((m) => m.status === "in_progress") ?? dep.milestones.find((m) => m.status === "blocked");
  const sentences: string[] = [];
  sentences.push(`${dep.name} is ${(dep.progress * 100).toFixed(0)}% complete — ${done} of ${dep.milestones.length} milestones done.`);
  if (current) sentences.push(`Currently on "${current.label}"${current.note ? `: ${current.note}` : "."}`);
  sentences.push(dep.delayed ? `The project is running behind: ${dep.delayReason}` : "The project is on schedule.");
  sentences.push(`Expected go-live ${new Date(dep.expectedGoLive).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })} — ${dep.plannedChargers} chargers, ${dep.plannedPowerKw} kW total.`);

  const bullets = [
    `Progress: ${(dep.progress * 100).toFixed(0)}% (${done}/${dep.milestones.length} milestones)`,
    `Next milestone: ${current?.label ?? "—"}`,
    `Expected go-live: ${new Date(dep.expectedGoLive).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}${dep.delayed ? " (delayed)" : ""}`,
    `Scope: ${dep.plannedChargers} chargers · ${dep.plannedPowerKw} kW`,
  ];
  const actions = dep.delayed ? ["Send the partner a re-baselined timeline with the reason", "Confirm the new grid-connection / works dates"] : ["Send the partner the latest milestone update", "Confirm the next milestone's date with the contractor"];

  return makeSummary(dep.organizationId, "deployment", dep.id, `${dep.name}: ${(dep.progress * 100).toFixed(0)}%${dep.delayed ? " · delayed" : ""}`, sentences.join(" "), bullets, actions);
}

// ---------------------------------------------------------------------------
// Email drafting
// ---------------------------------------------------------------------------

export interface DraftedEmail {
  subject: string;
  body: string;
}

export function draftPartnerEmail(kind: "monthly_update" | "incident_update" | "deployment_update" | "check_in", ctx: { partner: Partner; site?: Site; incident?: Incident; deployment?: Deployment; report?: RevenueReport; senderName: string }): DraftedEmail {
  const { partner, site, incident, deployment, report, senderName } = ctx;
  const greeting = `Hi ${partner.contactName.split(" ")[0]},`;
  const signoff = `\n\nBest,\n${senderName}\nPartner Success — Watty`;
  switch (kind) {
    case "monthly_update": {
      const m = site?.monthly[site.monthly.length - 1];
      return {
        subject: `Your ${report ? formatMonth(report.month) : m ? formatMonth(m.month) : "monthly"} charging update${site ? ` — ${shortName(site.name)}` : ""}`,
        body: `${greeting}\n\nHere's your latest charging summary.${m ? ` ${shortName(site!.name)} handled ${m.sessions.toLocaleString("en-US")} sessions at ${pct1(m.uptimePct)} uptime, generating ${formatMoney(m.revenueEur, "EUR")} in revenue.` : ""}${report ? ` Your ${formatMonth(report.month)} royalty statement of ${formatMoney(report.royaltyEur, "EUR")} ${report.status === "paid" ? "has been paid" : "is on its way"}.` : ""}\n\nThe full report is attached, and everything is also live in your PartnerOS dashboard. Happy to walk through any of it.${signoff}`,
      };
    }
    case "incident_update":
      return {
        subject: `Update on ${incident ? incident.title : "the open maintenance issue"}${site ? ` — ${shortName(site.name)}` : ""}`,
        body: `${greeting}\n\nA quick update on the maintenance issue at ${site ? shortName(site.name) : "your site"}: ${incident ? `it's currently ${titleCase(incident.status).toLowerCase()}${incident.etaAt ? `, with an estimated fix by ${new Date(incident.etaAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long" })}` : ""}.` : ""} The rest of the site remains operational. I'll let you know as soon as it's resolved.${signoff}`,
      };
    case "deployment_update":
      return {
        subject: `Deployment update — ${deployment ? deployment.name : site ? shortName(site.name) : "your new site"}`,
        body: `${greeting}\n\nProgress update on ${deployment ? deployment.name : "your deployment"}: we're at ${deployment ? (deployment.progress * 100).toFixed(0) : "—"}%${deployment?.delayed ? `, and unfortunately the timeline has shifted — ${deployment.delayReason}` : ", and we're on schedule"}. Expected go-live remains ${deployment ? new Date(deployment.expectedGoLive).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "as planned"}. Full timeline and documents are in your dashboard.${signoff}`,
      };
    case "check_in":
      return {
        subject: `Quick check-in — how are things going?`,
        body: `${greeting}\n\nIt's been a little while since we connected — I wanted to check in on how the charging sites are performing for you and whether there's anything we can do better. Would you have 20 minutes next week for a quick review? I can bring the latest numbers.${signoff}`,
      };
  }
}

// ---------------------------------------------------------------------------

let counter = 0;
function makeSummary(orgId: string, scope: AiSummary["scope"], refId: string, headline: string, body: string, bullets: string[], actions: string[]): AiSummary {
  return {
    id: `ai_${scope}_${refId}_${++counter}`,
    organizationId: orgId,
    scope,
    refId,
    headline,
    body,
    bullets: bullets.filter(Boolean),
    actions: actions.filter(Boolean),
    generatedAt: new Date().toISOString(),
    model: AI_MODEL_ID,
  };
}
