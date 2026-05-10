// VoltYield data access layer.
//
// This is the ONLY module the API routes and pages import for data. In the MVP
// it composes the static mock dataset with the recommendation engine. To go
// live, swap the bodies of these functions for Prisma queries / provider calls
// — the signatures and return shapes are the contract.
//
// State note: recommendation status and alert read-state are kept in module
// memory so the demo is interactive. A real implementation persists these.

import {
  Alert,
  BenchmarkRow,
  Competitor,
  KpiSummary,
  Organization,
  Recommendation,
  RecommendationStatus,
  Report,
  Site,
  User,
} from "./types";
import {
  COMPETITORS,
  CURRENT_USER,
  ORGANIZATION,
  PRICE_OBSERVATIONS,
  SITES,
  USERS,
  competitorsForSite,
  demandSignalsForSite,
  priceObservationsForSite,
  utilizationForSite,
} from "./mock-data";
import {
  buildBenchmark,
  buildReport,
  generateAlerts,
  generateRecommendations,
  summarizeKpis,
} from "./recommendation-engine";

// --- Mutable demo state ---------------------------------------------------

const recStatusOverrides = new Map<string, RecommendationStatus>();
const alertReadOverrides = new Set<string>();

// --- Memoized derived data ------------------------------------------------

let cache: {
  recommendations: Recommendation[];
  alerts: Alert[];
  benchmarks: BenchmarkRow[];
} | null = null;

function compute() {
  if (cache) return cache;
  const recommendations: Recommendation[] = [];
  const alerts: Alert[] = [];
  const benchmarks: BenchmarkRow[] = [];

  for (const site of SITES) {
    const competitors = competitorsForSite(site.id);
    const utilization = utilizationForSite(site.id);
    const demand = demandSignalsForSite(site.id);
    const priceObservations = priceObservationsForSite(site.id);

    benchmarks.push(buildBenchmark(site, competitors));

    const recs = generateRecommendations({ site, competitors, utilization, demand, settings: ORGANIZATION.settings });
    recommendations.push(...recs);

    const al = generateAlerts({
      site,
      competitors,
      utilization,
      priceObservations,
      demand,
      settings: ORGANIZATION.settings,
      recommendations: recs,
    });
    alerts.push(...al);
  }

  cache = { recommendations, alerts, benchmarks };
  return cache;
}

function applyOverrides<T extends Recommendation | Alert>(items: T[]): T[] {
  return items.map((it) => {
    if ("status" in it) {
      const override = recStatusOverrides.get(it.id);
      return override ? ({ ...it, status: override } as T) : it;
    }
    if (alertReadOverrides.has(it.id)) return { ...it, read: true } as T;
    return it;
  });
}

// --- Org / users ----------------------------------------------------------

export async function getOrganization(): Promise<Organization> {
  return ORGANIZATION;
}

export async function getCurrentUser(): Promise<User> {
  return CURRENT_USER;
}

export async function getUsers(): Promise<User[]> {
  return USERS;
}

// --- Sites ----------------------------------------------------------------

export async function getSites(): Promise<Site[]> {
  return SITES;
}

export async function getSite(id: string): Promise<Site | null> {
  return SITES.find((s) => s.id === id) ?? null;
}

export async function getSiteDetail(id: string): Promise<{
  site: Site;
  competitors: Competitor[];
  benchmark: BenchmarkRow;
  utilization: ReturnType<typeof utilizationForSite>;
  demand: ReturnType<typeof demandSignalsForSite>;
  priceObservations: ReturnType<typeof priceObservationsForSite>;
  recommendations: Recommendation[];
  alerts: Alert[];
} | null> {
  const site = await getSite(id);
  if (!site) return null;
  const { recommendations, alerts } = compute();
  return {
    site,
    competitors: competitorsForSite(id),
    benchmark: buildBenchmark(site, competitorsForSite(id)),
    utilization: utilizationForSite(id),
    demand: demandSignalsForSite(id),
    priceObservations: priceObservationsForSite(id),
    recommendations: applyOverrides(recommendations.filter((r) => r.siteId === id)),
    alerts: applyOverrides(alerts.filter((a) => a.siteId === id)),
  };
}

// --- Competitors ----------------------------------------------------------

export async function getCompetitors(): Promise<(Competitor & { siteName: string; ourPrice: number; gapAbs: number | null; gapPct: number | null })[]> {
  return COMPETITORS.map((c) => {
    const site = SITES.find((s) => s.id === c.siteId)!;
    const gapAbs = c.pricePerKwh === null ? null : Math.round((site.currentPricePerKwh - c.pricePerKwh) * 1000) / 1000;
    const gapPct = c.pricePerKwh === null || c.pricePerKwh === 0 ? null : Math.round(((site.currentPricePerKwh - c.pricePerKwh) / c.pricePerKwh) * 10000) / 10000;
    return { ...c, siteName: site.name, ourPrice: site.currentPricePerKwh, gapAbs, gapPct };
  });
}

// --- Benchmarks -----------------------------------------------------------

export async function getBenchmarks(): Promise<BenchmarkRow[]> {
  return compute().benchmarks;
}

// --- Recommendations ------------------------------------------------------

export async function getRecommendations(opts?: { siteId?: string; status?: RecommendationStatus }): Promise<Recommendation[]> {
  let recs = applyOverrides(compute().recommendations);
  if (opts?.siteId) recs = recs.filter((r) => r.siteId === opts.siteId);
  if (opts?.status) recs = recs.filter((r) => r.status === opts.status);
  return recs;
}

export async function getRecommendation(id: string): Promise<Recommendation | null> {
  return (await getRecommendations()).find((r) => r.id === id) ?? null;
}

export async function setRecommendationStatus(id: string, status: RecommendationStatus): Promise<Recommendation | null> {
  const exists = compute().recommendations.find((r) => r.id === id);
  if (!exists) return null;
  recStatusOverrides.set(id, status);
  return getRecommendation(id);
}

// --- Alerts ---------------------------------------------------------------

export async function getAlerts(opts?: { siteId?: string; unreadOnly?: boolean }): Promise<Alert[]> {
  let alerts = applyOverrides(compute().alerts).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  if (opts?.siteId) alerts = alerts.filter((a) => a.siteId === opts.siteId);
  if (opts?.unreadOnly) alerts = alerts.filter((a) => !a.read);
  return alerts;
}

export async function markAlertRead(id: string): Promise<Alert | null> {
  const exists = compute().alerts.find((a) => a.id === id);
  if (!exists) return null;
  alertReadOverrides.add(id);
  return (await getAlerts()).find((a) => a.id === id) ?? null;
}

export async function markAllAlertsRead(): Promise<number> {
  let n = 0;
  for (const a of compute().alerts) {
    if (!alertReadOverrides.has(a.id)) {
      alertReadOverrides.add(a.id);
      n += 1;
    }
  }
  return n;
}

// --- KPIs -----------------------------------------------------------------

export async function getKpis(): Promise<KpiSummary> {
  const { recommendations, benchmarks, alerts } = compute();
  return summarizeKpis({
    sites: SITES,
    benchmarks,
    recommendations: applyOverrides(recommendations),
    openAlerts: applyOverrides(alerts).filter((a) => !a.read).length,
  });
}

// --- Reports --------------------------------------------------------------

export async function getReports(): Promise<Report[]> {
  const { recommendations, benchmarks } = compute();
  const recs = applyOverrides(recommendations);
  // Current month + previous month (previous reuses the same engine output for
  // the MVP; a real impl snapshots month-end state).
  const periods = [
    { start: "2026-05-01", label: "May 2026" },
    { start: "2026-04-01", label: "April 2026" },
  ];
  return periods.map((p) =>
    buildReport({
      organizationId: ORGANIZATION.id,
      periodStart: p.start,
      periodLabel: p.label,
      sites: SITES,
      benchmarks,
      recommendations: recs,
    }),
  );
}

export async function getReport(id: string): Promise<Report | null> {
  return (await getReports()).find((r) => r.id === id) ?? null;
}

export async function getLatestReport(): Promise<Report> {
  return (await getReports())[0];
}

// Test/dev helper: drop the derived cache (used if mock data is mutated).
export function _resetCache() {
  cache = null;
}
