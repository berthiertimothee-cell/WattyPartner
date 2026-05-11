// PartnerOS — data access layer.
//
// This is the ONLY module pages and API routes import for data. In the MVP it
// reads the in-memory mock dataset (src/lib/mock-data.ts) and derives KPIs,
// alerts and AI summaries on top of it. To go live, replace the bodies of these
// functions with Prisma queries — the signatures and shapes stay the same.

import * as db from "./mock-data";
import {
  summariseDeployment,
  summariseIncident,
  summarisePartner,
  summariseReport,
  summariseSite,
} from "./ai";
import type {
  AiSummary,
  Campaign,
  Charger,
  Contract,
  Deployment,
  DocumentItem,
  Incident,
  IncidentStatus,
  IntegrationConfig,
  MaintenanceProvider,
  Notification,
  Partner,
  RevenueReport,
  Severity,
  Site,
  SiteBenchmark,
} from "./types";
import { daysFromNow, mean } from "./utils";

const OPEN_STATUSES: IncidentStatus[] = ["open", "in_progress", "waiting_external", "scheduled"];

export function isIncidentOpen(i: Incident): boolean {
  return OPEN_STATUSES.includes(i.status);
}

// --- identity -------------------------------------------------------------

export function getCurrentUser() {
  return db.users.find((u) => u.id === db.CURRENT_USER_ID)!;
}
export function getOrganization() {
  return db.organization;
}
export function getUser(id: string) {
  return db.users.find((u) => u.id === id);
}

// --- partners -------------------------------------------------------------

export function getPartners(): Partner[] {
  return [...db.partners].sort((a, b) => a.name.localeCompare(b.name));
}
export function getPartner(id: string): Partner | undefined {
  return db.partners.find((p) => p.id === id);
}
export function lastContactDays(p: Partner): number {
  return Math.max(0, -daysFromNow(p.lastContactAt));
}

// --- sites & chargers -----------------------------------------------------

export function getSites(opts: { partnerId?: string; status?: Site["status"] } = {}): Site[] {
  let list = [...db.sites];
  if (opts.partnerId) list = list.filter((s) => s.partnerId === opts.partnerId);
  if (opts.status) list = list.filter((s) => s.status === opts.status);
  return list.sort((a, b) => b.revenuePerMonthEur - a.revenuePerMonthEur || a.name.localeCompare(b.name));
}
export function getSite(id: string): Site | undefined {
  return db.sites.find((s) => s.id === id);
}
export function getChargersBySite(siteId: string): Charger[] {
  return db.chargers.filter((c) => c.siteId === siteId);
}
export function getActiveChargerCount(siteId: string): number {
  return db.chargers.filter((c) => c.siteId === siteId && (c.status === "available" || c.status === "charging")).length;
}

// --- incidents ------------------------------------------------------------

export function getIncidents(opts: { siteId?: string; partnerId?: string; status?: IncidentStatus; openOnly?: boolean } = {}): Incident[] {
  let list = [...db.incidents];
  if (opts.siteId) list = list.filter((i) => i.siteId === opts.siteId);
  if (opts.partnerId) {
    const siteIds = new Set(db.sites.filter((s) => s.partnerId === opts.partnerId).map((s) => s.id));
    list = list.filter((i) => siteIds.has(i.siteId));
  }
  if (opts.status) list = list.filter((i) => i.status === opts.status);
  if (opts.openOnly) list = list.filter(isIncidentOpen);
  return list.sort((a, b) => +new Date(b.openedAt) - +new Date(a.openedAt));
}
export function getIncident(id: string): Incident | undefined {
  return db.incidents.find((i) => i.id === id);
}
export function getMaintenanceProviders(): MaintenanceProvider[] {
  return [...db.maintenanceProviders];
}
export function getMaintenanceProvider(id?: string): MaintenanceProvider | undefined {
  return id ? db.maintenanceProviders.find((m) => m.id === id) : undefined;
}

// --- integrations ---------------------------------------------------------

export function getIntegrations(): IntegrationConfig[] {
  return [...db.integrations].sort((a, b) => a.label.localeCompare(b.label));
}
/** Hours past (positive) or remaining until (negative) the SLA deadline. */
export function slaHoursOver(i: Incident): number {
  return (Date.now() - +new Date(i.slaDueAt)) / 3_600_000;
}

// --- benchmarks -----------------------------------------------------------

export function getBenchmarks(): SiteBenchmark[] {
  return [...db.benchmarks];
}
export function getBenchmark(siteId: string): SiteBenchmark | undefined {
  return db.benchmarks.find((b) => b.siteId === siteId);
}

// --- revenue / royalties --------------------------------------------------

export function getRevenueReports(opts: { partnerId?: string } = {}): RevenueReport[] {
  let list = [...db.revenueReports];
  if (opts.partnerId) list = list.filter((r) => r.partnerId === opts.partnerId);
  return list.sort((a, b) => (b.month < a.month ? -1 : 1));
}
export function getRevenueReport(id: string): RevenueReport | undefined {
  return db.revenueReports.find((r) => r.id === id);
}
export function getLatestReportForPartner(partnerId: string): RevenueReport | undefined {
  return getRevenueReports({ partnerId }).slice().sort((a, b) => (b.month < a.month ? -1 : 1))[0];
}
/** Naive next-payout estimate: average of the partner's last 3 royalty amounts. */
export function estimateNextPayout(partnerId: string): number | null {
  const rs = getRevenueReports({ partnerId }).slice(0, 3).map((r) => r.royaltyEur);
  return rs.length ? Math.round(mean(rs)!) : null;
}

// --- deployments ----------------------------------------------------------

export function getDeployments(opts: { partnerId?: string } = {}): Deployment[] {
  let list = [...db.deployments];
  if (opts.partnerId) list = list.filter((d) => d.partnerId === opts.partnerId);
  return list.sort((a, b) => +new Date(a.expectedGoLive) - +new Date(b.expectedGoLive));
}
export function getDeployment(id: string): Deployment | undefined {
  return db.deployments.find((d) => d.id === id);
}
export function getDeploymentForSite(siteId: string): Deployment | undefined {
  return db.deployments.find((d) => d.siteId === siteId);
}

// --- campaigns ------------------------------------------------------------

export function getCampaigns(opts: { partnerId?: string } = {}): Campaign[] {
  let list = [...db.campaigns];
  if (opts.partnerId) list = list.filter((c) => c.partnerId === opts.partnerId);
  const order: Record<Campaign["status"], number> = { active: 0, scheduled: 1, draft: 2, completed: 3 };
  return list.sort((a, b) => order[a.status] - order[b.status] || +new Date(b.startsAt) - +new Date(a.startsAt));
}
export function getCampaign(id: string): Campaign | undefined {
  return db.campaigns.find((c) => c.id === id);
}

// --- documents & contracts ------------------------------------------------

export function getDocuments(opts: { partnerId?: string; siteId?: string; kind?: DocumentItem["kind"] } = {}): DocumentItem[] {
  let list = [...db.documents];
  if (opts.partnerId) list = list.filter((d) => d.partnerId === opts.partnerId);
  if (opts.siteId) list = list.filter((d) => d.siteId === opts.siteId);
  if (opts.kind) list = list.filter((d) => d.kind === opts.kind);
  return list.sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt));
}
export function getDocument(id: string): DocumentItem | undefined {
  return db.documents.find((d) => d.id === id);
}
export function getContracts(opts: { partnerId?: string } = {}): Contract[] {
  let list = [...db.contracts];
  if (opts.partnerId) list = list.filter((c) => c.partnerId === opts.partnerId);
  return list;
}

// --- notifications / alerts ----------------------------------------------

export function getNotifications(opts: { unreadOnly?: boolean; partnerId?: string; severity?: Severity } = {}): Notification[] {
  let list = [...db.notifications];
  if (opts.unreadOnly) list = list.filter((n) => !n.read);
  if (opts.partnerId) list = list.filter((n) => n.partnerId === opts.partnerId);
  if (opts.severity) list = list.filter((n) => n.severity === opts.severity);
  const sev: Record<Severity, number> = { critical: 0, warning: 1, opportunity: 2, info: 3 };
  return list.sort((a, b) => sev[a.severity] - sev[b.severity] || +new Date(b.createdAt) - +new Date(a.createdAt));
}

// --- AI summaries ---------------------------------------------------------

export function getSiteSummary(siteId: string): AiSummary | undefined {
  const site = getSite(siteId);
  if (!site) return undefined;
  return summariseSite(site, getBenchmark(siteId), getIncidents({ siteId, openOnly: true }));
}
export function getPartnerSummary(partnerId: string): AiSummary | undefined {
  const partner = getPartner(partnerId);
  if (!partner) return undefined;
  return summarisePartner(partner, getSites({ partnerId }), getIncidents({ partnerId, openOnly: true }), lastContactDays(partner), getLatestReportForPartner(partnerId));
}
export function getIncidentSummary(id: string): AiSummary | undefined {
  const inc = getIncident(id);
  if (!inc) return undefined;
  return summariseIncident(inc, getSite(inc.siteId)?.name ?? "Site", getMaintenanceProvider(inc.maintenanceProviderId)?.name);
}
export function getReportSummary(id: string): AiSummary | undefined {
  const r = getRevenueReport(id);
  if (!r) return undefined;
  const partner = getPartner(r.partnerId)!;
  return summariseReport(r, partner, new Map(db.sites.map((s) => [s.id, s])));
}
export function getDeploymentSummary(id: string): AiSummary | undefined {
  const d = getDeployment(id);
  return d ? summariseDeployment(d) : undefined;
}

// --- aggregated metrics ---------------------------------------------------

export interface Trend {
  /** Most recent value. */
  value: number;
  /** Fractional change vs the prior period (null if unknown). */
  delta: number | null;
}

function trendFromSeries(series: number[]): Trend {
  if (!series.length) return { value: 0, delta: null };
  const value = series[series.length - 1];
  if (series.length < 2) return { value, delta: null };
  const prev = series[series.length - 2];
  return { value, delta: prev ? (value - prev) / prev : null };
}

/** Build a network-wide monthly aggregate across all live sites. */
function networkMonthly(sites: Site[]): { month: string; sessions: number; revenueEur: number; energyKwh: number; uptimePct: number }[] {
  const byMonth = new Map<string, { sessions: number; revenueEur: number; energyKwh: number; uptimes: number[] }>();
  for (const s of sites) {
    for (const m of s.monthly) {
      const e = byMonth.get(m.month) ?? { sessions: 0, revenueEur: 0, energyKwh: 0, uptimes: [] };
      e.sessions += m.sessions;
      e.revenueEur += m.revenueEur;
      e.energyKwh += m.energyKwh;
      e.uptimes.push(m.uptimePct);
      byMonth.set(m.month, e);
    }
  }
  return [...byMonth.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([month, e]) => ({ month, sessions: e.sessions, revenueEur: e.revenueEur, energyKwh: e.energyKwh, uptimePct: mean(e.uptimes) ?? 1 }));
}

export interface DashboardMetrics {
  partnersCount: number;
  activeSitesCount: number;
  totalSitesCount: number;
  activeChargersCount: number;
  totalChargersCount: number;
  openIncidentsCount: number;
  slaAtRiskCount: number;
  activeDeploymentsCount: number;
  delayedDeploymentsCount: number;
  estimatedRoyaltiesThisMonth: number;
  revenue: Trend; // most recent full month, MoM
  sessions: Trend;
  energyKwh: Trend;
  uptime: Trend;
  monthly: ReturnType<typeof networkMonthly>;
}

export function getDashboardMetrics(): DashboardMetrics {
  const sites = db.sites;
  const liveSites = sites.filter((s) => s.monthly.length);
  const monthly = networkMonthly(liveSites);
  const incidents = db.incidents;
  const openIncidents = incidents.filter(isIncidentOpen);
  const deployments = db.deployments;
  // Estimated royalties this month = sum over partners of (this-month site revenue net of energy+fee) × royaltyRate.
  let royaltyEstimate = 0;
  for (const p of db.partners) {
    const ps = liveSites.filter((s) => s.partnerId === p.id);
    let gross = 0;
    let energy = 0;
    for (const s of ps) {
      const m = s.monthly[s.monthly.length - 1];
      gross += m.revenueEur;
      energy += Math.round(m.energyKwh * 0.16);
    }
    const fee = Math.round(gross * 0.05);
    royaltyEstimate += Math.max(0, Math.round((gross - energy - fee) * p.royaltyRate));
  }
  return {
    partnersCount: db.partners.length,
    activeSitesCount: sites.filter((s) => s.status === "active").length,
    totalSitesCount: sites.length,
    activeChargersCount: db.chargers.filter((c) => c.status === "available" || c.status === "charging").length,
    totalChargersCount: db.chargers.length,
    openIncidentsCount: openIncidents.length,
    slaAtRiskCount: openIncidents.filter((i) => slaHoursOver(i) > -12).length,
    activeDeploymentsCount: deployments.length,
    delayedDeploymentsCount: deployments.filter((d) => d.delayed).length,
    estimatedRoyaltiesThisMonth: royaltyEstimate,
    revenue: trendFromSeries(monthly.map((m) => m.revenueEur)),
    sessions: trendFromSeries(monthly.map((m) => m.sessions)),
    energyKwh: trendFromSeries(monthly.map((m) => m.energyKwh)),
    uptime: trendFromSeries(monthly.map((m) => m.uptimePct)),
    monthly,
  };
}

export interface PartnerMetrics {
  sitesCount: number;
  liveSitesCount: number;
  chargersCount: number;
  activeChargersCount: number;
  openIncidentsCount: number;
  activeDeploymentsCount: number;
  revenueThisMonth: number;
  avgUptime: number | null;
  estimatedNextPayout: number | null;
  monthly: ReturnType<typeof networkMonthly>;
}

export function getPartnerMetrics(partnerId: string): PartnerMetrics {
  const ps = getSites({ partnerId });
  const live = ps.filter((s) => s.monthly.length);
  const monthly = networkMonthly(live);
  const inc = getIncidents({ partnerId, openOnly: true });
  return {
    sitesCount: ps.length,
    liveSitesCount: live.length,
    chargersCount: ps.reduce((n, s) => n + s.chargerCount, 0),
    activeChargersCount: ps.reduce((n, s) => n + getActiveChargerCount(s.id), 0),
    openIncidentsCount: inc.length,
    activeDeploymentsCount: getDeployments({ partnerId }).length,
    revenueThisMonth: live.reduce((sum, s) => sum + s.revenuePerMonthEur, 0),
    avgUptime: mean(live.map((s) => s.uptimePct)),
    estimatedNextPayout: estimateNextPayout(partnerId),
    monthly,
  };
}

// --- recent activity feed -------------------------------------------------

export interface ActivityItem {
  id: string;
  at: string;
  kind: "incident" | "report" | "deployment" | "campaign" | "document" | "alert";
  title: string;
  detail?: string;
  href?: string;
  partnerId?: string;
}

export function getRecentActivity(limit = 12): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const i of db.incidents) {
    const ev = i.timeline[i.timeline.length - 1];
    items.push({ id: `act_inc_${i.id}`, at: ev?.at ?? i.openedAt, kind: "incident", title: i.resolvedAt ? `Incident resolved — ${i.title}` : `Incident update — ${i.title}`, detail: ev?.label, href: `/incidents/${i.id}`, partnerId: getSite(i.siteId)?.partnerId });
  }
  for (const r of db.revenueReports.filter((r) => r.issuedAt)) {
    const p = getPartner(r.partnerId);
    items.push({ id: `act_rep_${r.id}`, at: r.paidAt ?? r.issuedAt!, kind: "report", title: `${r.paidAt ? "Royalty paid" : "Statement issued"} — ${p?.name}`, detail: `${r.month} · €${r.royaltyEur.toLocaleString("en-US")}`, href: `/revenues`, partnerId: r.partnerId });
  }
  for (const d of db.deployments) {
    const done = d.milestones.filter((m) => m.completedAt).sort((a, b) => +new Date(b.completedAt!) - +new Date(a.completedAt!))[0];
    if (done) items.push({ id: `act_dep_${d.id}`, at: done.completedAt!, kind: "deployment", title: `Milestone completed — ${d.name}`, detail: done.label, href: `/deployments/${d.id}`, partnerId: d.partnerId });
  }
  for (const c of db.campaigns.filter((c) => c.status === "active" || c.status === "completed")) {
    items.push({ id: `act_cmp_${c.id}`, at: c.startsAt, kind: "campaign", title: `Campaign ${c.status === "active" ? "running" : "completed"} — ${c.name}`, detail: c.sessionsGenerated ? `${c.sessionsGenerated.toLocaleString("en-US")} sessions` : undefined, href: `/campaigns`, partnerId: c.partnerId });
  }
  for (const doc of db.documents) {
    items.push({ id: `act_doc_${doc.id}`, at: doc.uploadedAt, kind: "document", title: `Document added — ${doc.name}`, detail: doc.uploadedBy, href: `/documents`, partnerId: doc.partnerId });
  }
  return items.sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, limit);
}
