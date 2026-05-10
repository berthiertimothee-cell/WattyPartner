// PartnerOS — domain types
// A Partner Success Platform for EV charging networks (CPOs).
// These types mirror the Prisma schema in /prisma/schema.prisma so the mock
// data layer in src/lib/mock-data.ts can be swapped for a real database.

export type Severity = "info" | "opportunity" | "warning" | "critical";

export type UserRole = "operator_admin" | "operator_member" | "partner";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  /** For partner users, the partner they belong to. */
  partnerId?: string;
  avatarColor: string;
}

export interface Organization {
  id: string;
  name: string;
  legalName: string;
  country: string;
  currency: "EUR" | "USD" | "GBP";
  contactEmail: string;
}

export type PartnerType =
  | "retail"
  | "hospitality"
  | "real_estate"
  | "fleet"
  | "municipality"
  | "workplace";

export interface Partner {
  id: string;
  organizationId: string;
  name: string;
  type: PartnerType;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  city: string;
  region: string;
  logoColor: string;
  /** ISO date the partnership started. */
  since: string;
  /** Revenue-share percentage paid to the partner (0..1). */
  royaltyRate: number;
  status: "active" | "onboarding" | "churned";
  /** ISO date of last meaningful communication with this partner. */
  lastContactAt: string;
  accountManagerId: string;
}

export type SiteStatus = "active" | "maintenance" | "construction" | "planned" | "offline";
export type ElectricitySource = "grid" | "grid_green" | "solar_hybrid";

export interface Charger {
  id: string;
  siteId: string;
  model: string;
  vendor: string;
  powerKw: number;
  connectors: number;
  type: "AC" | "DC";
  status: "available" | "charging" | "faulted" | "offline" | "maintenance";
  commissionedAt: string;
}

export interface MonthlyMetric {
  /** YYYY-MM */
  month: string;
  sessions: number;
  energyKwh: number;
  revenueEur: number;
  uptimePct: number; // 0..1
  avgPriceEurKwh: number;
}

export interface Site {
  id: string;
  organizationId: string;
  partnerId: string;
  name: string;
  address: string;
  city: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
  photoColor: string; // placeholder hero color
  status: SiteStatus;
  electricitySource: ElectricitySource;
  commissionedAt: string | null;
  expectedGoLive?: string;
  operatorName: string; // O&M operator
  chargerCount: number;
  totalPowerKw: number;
  /** Trailing monthly metrics, oldest first. */
  monthly: MonthlyMetric[];
  uptimePct: number; // current rolling uptime 0..1
  sessionsPerDay: number;
  revenuePerMonthEur: number;
}

export type IncidentStatus =
  | "open"
  | "in_progress"
  | "waiting_external"
  | "scheduled"
  | "resolved";

export type IncidentCategory =
  | "hardware_fault"
  | "connectivity"
  | "vandalism"
  | "cable_theft"
  | "power_supply"
  | "payment_terminal"
  | "software"
  | "other";

export interface IncidentEvent {
  at: string; // ISO
  label: string;
  by: string;
}

export interface Incident {
  id: string;
  organizationId: string;
  siteId: string;
  chargerId?: string;
  title: string;
  description: string;
  category: IncidentCategory;
  status: IncidentStatus;
  severity: "low" | "medium" | "high";
  openedAt: string; // ISO
  resolvedAt?: string; // ISO
  /** SLA target resolution time (ISO). */
  slaDueAt: string;
  maintenanceProviderId?: string;
  /** ETA communicated to the partner. */
  etaAt?: string;
  photoColors: string[];
  timeline: IncidentEvent[];
}

export interface MaintenanceProvider {
  id: string;
  organizationId: string;
  name: string;
  contactEmail: string;
  phone: string;
  regions: string[];
  avgResolutionHours: number;
  rating: number; // 1..5
}

export interface RoyaltyLine {
  label: string;
  amountEur: number; // positive = credit to partner, negative = deduction
  kind: "gross_revenue" | "energy_cost" | "platform_fee" | "adjustment" | "royalty";
}

export interface RevenueReport {
  id: string;
  organizationId: string;
  partnerId: string;
  /** YYYY-MM */
  month: string;
  siteIds: string[];
  grossRevenueEur: number;
  energyCostEur: number;
  platformFeeEur: number;
  royaltyEur: number; // net payable to the partner
  lines: RoyaltyLine[];
  status: "draft" | "issued" | "paid";
  issuedAt?: string;
  paidAt?: string;
  discrepancy?: { detected: boolean; note: string };
}

export type DeploymentStage =
  | "site_survey"
  | "permitting"
  | "grid_connection"
  | "civil_works"
  | "equipment_delivery"
  | "installation"
  | "commissioning"
  | "go_live";

export interface DeploymentMilestone {
  stage: DeploymentStage;
  label: string;
  status: "done" | "in_progress" | "blocked" | "pending";
  plannedAt: string;
  completedAt?: string;
  note?: string;
}

export interface Deployment {
  id: string;
  organizationId: string;
  partnerId: string;
  siteId: string;
  name: string;
  city: string;
  region: string;
  progress: number; // 0..1
  expectedGoLive: string; // ISO
  delayed: boolean;
  delayReason?: string;
  plannedChargers: number;
  plannedPowerKw: number;
  milestones: DeploymentMilestone[];
  documentIds: string[];
}

export type CompetitorBrand =
  | "Tesla Supercharger"
  | "Ionity"
  | "Fastned"
  | "TotalEnergies"
  | "Electra"
  | "Allego"
  | "Power Dot"
  | "Engie Vianeo";

export interface CompetitorPoint {
  brand: CompetitorBrand;
  distanceKm: number;
  maxPowerKw: number;
  priceEurKwh: number;
  estimatedUtilizationPct: number; // 0..1
}

export interface SiteBenchmark {
  siteId: string;
  ourPriceEurKwh: number;
  ourMaxPowerKw: number;
  ourUtilizationPct: number;
  competitors: CompetitorPoint[];
  marketSharePct: number; // 0..1
  position: "underpriced" | "aligned" | "overpriced" | "unknown";
}

export type CampaignType =
  | "promo_code"
  | "session_discount"
  | "onboarding"
  | "reopening"
  | "retailer"
  | "fleet";

export interface Campaign {
  id: string;
  organizationId: string;
  partnerId: string;
  name: string;
  type: CampaignType;
  status: "draft" | "scheduled" | "active" | "completed";
  startsAt: string;
  endsAt: string;
  siteIds: string[];
  promoCode?: string;
  discountPct?: number;
  sessionsGenerated: number;
  promoRedemptions: number;
  estimatedUpliftPct: number; // vs baseline
  budgetEur: number;
}

export type DocumentKind =
  | "contract"
  | "amendment"
  | "invoice"
  | "report"
  | "permit"
  | "technical"
  | "signed_pdf"
  | "other";

export interface DocumentItem {
  id: string;
  organizationId: string;
  partnerId?: string;
  siteId?: string;
  name: string;
  kind: DocumentKind;
  sizeKb: number;
  uploadedAt: string;
  uploadedBy: string;
  url: string;
}

export interface Contract {
  id: string;
  organizationId: string;
  partnerId: string;
  title: string;
  type: "framework" | "site_specific" | "amendment";
  status: "active" | "expired" | "pending_signature";
  startsAt: string;
  endsAt: string;
  royaltyRate: number;
  documentId: string;
  signedBy?: string;
}

export type NotificationType =
  | "uptime_drop"
  | "charger_offline"
  | "revenue_decline"
  | "missing_invoice"
  | "deployment_delay"
  | "unresolved_incident"
  | "utilization_opportunity"
  | "partner_inactivity"
  | "discrepancy";

export interface Notification {
  id: string;
  organizationId: string;
  type: NotificationType;
  severity: Severity;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  partnerId?: string;
  siteId?: string;
  href?: string;
}

export type AiSummaryScope = "site" | "partner" | "incident" | "monthly_report" | "deployment";

export interface AiSummary {
  id: string;
  organizationId: string;
  scope: AiSummaryScope;
  refId: string;
  headline: string;
  body: string;
  bullets: string[];
  actions: string[];
  generatedAt: string;
  model: string;
}
