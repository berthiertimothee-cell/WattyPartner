// VoltYield domain types — shared across data layer, API routes, and UI.
// These mirror the Prisma schema in /prisma/schema.prisma so the mock data
// layer can be swapped for a real database with minimal changes.

export type ID = string;

export type Currency = "EUR" | "USD" | "GBP";

export type ConnectorType = "CCS" | "CHAdeMO" | "Type2" | "Tesla" | "GB/T";

export interface Organization {
  id: ID;
  name: string;
  country: string;
  currency: Currency;
  /** Pricing strategy knobs used by the recommendation engine. */
  settings: OrgSettings;
  createdAt: string;
}

export interface OrgSettings {
  /** Target margin headroom over local competitor average, as a fraction (0.05 = 5%). */
  targetGapAbove: number;
  /** Below this utilization we consider a site under-utilized. */
  lowUtilizationThreshold: number;
  /** Above this utilization we consider a site saturated / high demand. */
  highUtilizationThreshold: number;
  /** Minimum price step the operator is willing to move, in currency units per kWh. */
  minPriceStep: number;
  /** Whether automated price pushes are enabled (always false in MVP). */
  autoApply: boolean;
}

export type Role = "owner" | "admin" | "analyst" | "viewer";

export interface User {
  id: ID;
  organizationId: ID;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface Site {
  id: ID;
  organizationId: ID;
  name: string;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  operatorName: string;
  /** Max charger power available at the site, kW. */
  maxPowerKw: number;
  currentPricePerKwh: number;
  currency: Currency;
  /** 0..1 — share of time stalls are in use over the trailing 30 days. */
  utilizationRate: number;
  sessionsPerDay: number;
  revenuePerMonth: number;
  /** 0..1 — share of time the site is operational. */
  uptime: number;
  chargers: Charger[];
  status: "active" | "maintenance" | "planned";
  createdAt: string;
}

export interface Charger {
  id: ID;
  siteId: ID;
  label: string;
  powerKw: number;
  connectorTypes: ConnectorType[];
  count: number;
}

export interface Competitor {
  id: ID;
  /** Site this competitor was discovered near. */
  siteId: ID;
  name: string;
  operatorName: string;
  lat: number;
  lng: number;
  /** Straight-line distance from our site, km. */
  distanceKm: number;
  maxPowerKw: number;
  pricePerKwh: number | null;
  currency: Currency;
  /** 0..1, or null if the provider does not expose live availability. */
  availability: number | null;
  source: DataSource;
  lastSeenAt: string;
}

export type DataSource =
  | "mock"
  | "openchargemap"
  | "chargeprice"
  | "google_places"
  | "roaming_api"
  | "csv_import"
  | "manual";

export interface PriceObservation {
  id: ID;
  competitorId: ID | null;
  siteId: ID;
  pricePerKwh: number;
  currency: Currency;
  observedAt: string;
  source: DataSource;
}

export interface UtilizationPoint {
  /** Hour of day, 0..23. */
  hour: number;
  /** 0..1 utilization for that hour, averaged over the period. */
  utilization: number;
  /** Estimated sessions in that hour. */
  sessions: number;
}

export interface UtilizationData {
  siteId: ID;
  /** ISO date the series was computed for (most recent 7-day average). */
  asOf: string;
  hourly: UtilizationPoint[];
  /** 0=Mon .. 6=Sun average utilization. */
  weekday: number[];
}

export type RecommendationType =
  | "lower_price"
  | "raise_price"
  | "happy_hour"
  | "hold_price"
  | "promo_test";

export type RecommendationStatus = "open" | "accepted" | "dismissed" | "exported";

export type Severity = "info" | "opportunity" | "warning" | "critical";

export interface Recommendation {
  id: ID;
  siteId: ID;
  type: RecommendationType;
  severity: Severity;
  /** Short headline shown in lists. */
  title: string;
  /** One or two sentence explanation — rule-based, optionally rephrased by an LLM. */
  rationale: string;
  /** Concrete suggested action, human readable. */
  action: string;
  /** Suggested price delta per kWh (can be negative). null for non-price actions. */
  suggestedPriceDelta: number | null;
  /** Optional time window the action applies to, e.g. "18:00-22:00". */
  window?: string;
  /** Estimated impact, for the UI. */
  estimatedImpact: {
    sessionsChangePct?: number;
    revenueChangePct?: number;
    revenueChangePerMonth?: number;
  };
  /** Inputs that triggered the rule — useful for transparency / debugging. */
  signals: Record<string, number | string | boolean>;
  status: RecommendationStatus;
  createdAt: string;
}

export type AlertType =
  | "competitor_price_change"
  | "site_overpriced"
  | "site_underpriced"
  | "utilization_drop"
  | "revenue_opportunity"
  | "high_demand_window";

export interface Alert {
  id: ID;
  siteId: ID;
  type: AlertType;
  severity: Severity;
  title: string;
  message: string;
  /** Free-form payload, e.g. {"oldPrice":0.42,"newPrice":0.39}. */
  data: Record<string, number | string | boolean>;
  read: boolean;
  createdAt: string;
}

export interface Report {
  id: ID;
  organizationId: ID;
  /** First day of the reporting month, ISO date. */
  periodStart: string;
  periodLabel: string; // e.g. "April 2026"
  generatedAt: string;
  summary: ReportSummary;
}

export interface ReportSummary {
  avgPricePerKwh: number;
  competitorAvgPricePerKwh: number;
  avgUtilization: number;
  totalRevenue: number;
  revenueOpportunity: number;
  recommendedActions: number;
  topUnderperformingSites: { siteId: ID; siteName: string; utilization: number; note: string }[];
  topPriceIncreaseOpportunities: { siteId: ID; siteName: string; suggestedDelta: number; note: string }[];
  pricingPerformanceNote: string;
  benchmarkNote: string;
}

// --- Demand signals -------------------------------------------------------

export type WeatherCondition = "clear" | "clouds" | "rain" | "snow" | "storm";

export interface DemandSignals {
  siteId: ID;
  asOf: string;
  weather: { condition: WeatherCondition; tempC: number; impact: number /* -1..1 */ };
  isHoliday: boolean;
  holidayName?: string;
  localEvents: { name: string; date: string; expectedExtraDemand: number /* 0..1 */ }[];
  trafficIndex: number; // 0..1 relative to typical
  isWeekend: boolean;
  hourOfDay: number;
  dayOfWeek: number; // 0=Mon
  /** Composite multiplier the engine applies to baseline demand. ~1.0 neutral. */
  demandMultiplier: number;
}

// --- Derived / computed view models --------------------------------------

export interface BenchmarkRow {
  siteId: ID;
  siteName: string;
  city: string;
  ourPrice: number;
  competitorAvg: number | null;
  competitorMin: number | null;
  competitorMax: number | null;
  competitorCount: number;
  /** ourPrice - competitorAvg, in currency units. */
  gapAbs: number | null;
  /** (ourPrice - competitorAvg) / competitorAvg. */
  gapPct: number | null;
  utilizationRate: number;
  position: "underpriced" | "aligned" | "overpriced" | "unknown";
}

export interface KpiSummary {
  avgPricePerKwh: number;
  currency: Currency;
  /** Weighted competitor gap across the portfolio, as a fraction. */
  competitorGapPct: number;
  /** Estimated additional monthly revenue if all open recommendations are applied. */
  revenueOpportunity: number;
  /** Portfolio-weighted utilization, 0..1. */
  utilizationRate: number;
  recommendedActions: number;
  openAlerts: number;
  siteCount: number;
}
