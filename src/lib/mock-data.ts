// PartnerOS — static demo dataset.
//
// Hand-authored, realistic data for a mid-size French EV charging operator
// (CPO) running a partner network across retailers, hotels, real-estate groups,
// fleets and municipalities. Monthly metric series are generated from compact
// seeds so the file stays readable. Replace this module with a real database
// (see prisma/schema.prisma) without touching the rest of the app.

import type {
  AiSummary,
  Campaign,
  Charger,
  Contract,
  Deployment,
  DocumentItem,
  Incident,
  MaintenanceProvider,
  MonthlyMetric,
  Notification,
  Organization,
  Partner,
  RevenueReport,
  Site,
  SiteBenchmark,
  User,
} from "./types";

export const ORG_ID = "org_watty";
export const NOW = new Date("2026-05-10T09:00:00Z");

function isoDaysAgo(days: number, hour = 9): string {
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}
function isoDaysAhead(days: number): string {
  return isoDaysAgo(-days);
}
function monthKey(offsetFromNow: number): string {
  // offsetFromNow: 0 = current month, -1 = last month, etc.
  const d = new Date(Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth() + offsetFromNow, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Deterministic pseudo-random so the demo is stable across renders.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build a trailing-N-month metric series. `base` is the most-recent-month
 * session count; the series grows from a slightly lower point with seasonal
 * noise and a couple of dips driven by `dipMonths` (uptime hits).
 */
function buildMonthly(opts: {
  seed: number;
  months: number;
  baseSessions: number;
  growth: number; // total fractional growth across the window
  avgPrice: number; // €/kWh
  kwhPerSession: number;
  baseUptime: number; // 0..1
  dipMonths?: number[]; // indices (0 = oldest) with reduced uptime
}): MonthlyMetric[] {
  const { seed, months, baseSessions, growth, avgPrice, kwhPerSession, baseUptime, dipMonths = [] } = opts;
  const rnd = mulberry32(seed);
  const out: MonthlyMetric[] = [];
  const startSessions = baseSessions / (1 + growth);
  for (let i = 0; i < months; i++) {
    const t = i / (months - 1);
    const seasonal = 1 + 0.07 * Math.sin((i / 12) * 2 * Math.PI);
    const noise = 0.94 + rnd() * 0.12;
    const sessions = Math.round((startSessions + (baseSessions - startSessions) * t) * seasonal * noise);
    const dip = dipMonths.includes(i) ? 0.06 + rnd() * 0.06 : 0;
    const uptimePct = Math.max(0.8, Math.min(0.999, baseUptime - dip + (rnd() - 0.5) * 0.01));
    const price = +(avgPrice * (0.97 + rnd() * 0.06)).toFixed(3);
    const energyKwh = Math.round(sessions * kwhPerSession * (0.95 + rnd() * 0.1));
    const revenueEur = Math.round(energyKwh * price);
    out.push({
      month: monthKey(-(months - 1 - i)),
      sessions,
      energyKwh,
      revenueEur,
      uptimePct: +uptimePct.toFixed(3),
      avgPriceEurKwh: price,
    });
  }
  return out;
}

function last<T>(arr: T[]): T {
  return arr[arr.length - 1];
}

// ---------------------------------------------------------------------------
// Organization & users
// ---------------------------------------------------------------------------

export const organization: Organization = {
  id: ORG_ID,
  name: "Watty",
  legalName: "Watty Mobility SAS",
  country: "France",
  currency: "EUR",
  contactEmail: "partners@watty.eu",
};

export const users: User[] = [
  {
    id: "usr_camille",
    name: "Camille Laurent",
    email: "camille.laurent@watty.eu",
    role: "operator_admin",
    organizationId: ORG_ID,
    avatarColor: "#1E4ED8",
  },
  {
    id: "usr_thomas",
    name: "Thomas Mercier",
    email: "thomas.mercier@watty.eu",
    role: "operator_member",
    organizationId: ORG_ID,
    avatarColor: "#0B1F4D",
  },
  {
    id: "usr_partner_carrefour",
    name: "Sophie Berthier",
    email: "sophie.berthier@carrefour-bretagne.fr",
    role: "partner",
    organizationId: ORG_ID,
    partnerId: "ptr_carrefour",
    avatarColor: "#16A34A",
  },
];

export const CURRENT_USER_ID = "usr_camille";

// ---------------------------------------------------------------------------
// Partners
// ---------------------------------------------------------------------------

export const partners: Partner[] = [
  {
    id: "ptr_carrefour",
    organizationId: ORG_ID,
    name: "Carrefour Bretagne",
    type: "retail",
    contactName: "Sophie Berthier",
    contactEmail: "sophie.berthier@carrefour-bretagne.fr",
    contactPhone: "+33 2 99 12 34 56",
    city: "Rennes",
    region: "Bretagne",
    logoColor: "#1E4ED8",
    since: "2022-06-01",
    royaltyRate: 0.18,
    status: "active",
    lastContactAt: isoDaysAgo(6),
    accountManagerId: "usr_thomas",
  },
  {
    id: "ptr_mercure",
    organizationId: ORG_ID,
    name: "Hôtels Océane Ouest",
    type: "hospitality",
    contactName: "Julien Caron",
    contactEmail: "julien.caron@oceane-hotels.fr",
    contactPhone: "+33 2 40 55 11 22",
    city: "Nantes",
    region: "Pays de la Loire",
    logoColor: "#0B1F4D",
    since: "2023-02-15",
    royaltyRate: 0.15,
    status: "active",
    lastContactAt: isoDaysAgo(19),
    accountManagerId: "usr_thomas",
  },
  {
    id: "ptr_fonciere",
    organizationId: ORG_ID,
    name: "Foncière Atlantique",
    type: "real_estate",
    contactName: "Marc Lefèvre",
    contactEmail: "m.lefevre@fonciere-atlantique.fr",
    contactPhone: "+33 5 56 78 90 12",
    city: "Bordeaux",
    region: "Nouvelle-Aquitaine",
    logoColor: "#7C3AED",
    since: "2023-09-01",
    royaltyRate: 0.2,
    status: "active",
    lastContactAt: isoDaysAgo(47),
    accountManagerId: "usr_camille",
  },
  {
    id: "ptr_greenfleet",
    organizationId: ORG_ID,
    name: "Greenfleet Logistics",
    type: "fleet",
    contactName: "Aurélie Dupont",
    contactEmail: "aurelie.dupont@greenfleet.fr",
    contactPhone: "+33 4 72 33 44 55",
    city: "Lyon",
    region: "Auvergne-Rhône-Alpes",
    logoColor: "#16A34A",
    since: "2024-01-10",
    royaltyRate: 0.12,
    status: "active",
    lastContactAt: isoDaysAgo(11),
    accountManagerId: "usr_thomas",
  },
  {
    id: "ptr_saintmalo",
    organizationId: ORG_ID,
    name: "Ville de Saint-Malo",
    type: "municipality",
    contactName: "Hélène Morvan",
    contactEmail: "h.morvan@ville-saint-malo.fr",
    contactPhone: "+33 2 99 40 71 00",
    city: "Saint-Malo",
    region: "Bretagne",
    logoColor: "#F59E0B",
    since: "2022-11-20",
    royaltyRate: 0.1,
    status: "active",
    lastContactAt: isoDaysAgo(4),
    accountManagerId: "usr_camille",
  },
  {
    id: "ptr_decathlon",
    organizationId: ORG_ID,
    name: "Decathlon Sud-Ouest",
    type: "retail",
    contactName: "Nicolas Roy",
    contactEmail: "nicolas.roy@decathlon-so.fr",
    contactPhone: "+33 5 61 22 33 44",
    city: "Toulouse",
    region: "Occitanie",
    logoColor: "#DC2626",
    since: "2024-08-05",
    royaltyRate: 0.16,
    status: "onboarding",
    lastContactAt: isoDaysAgo(2),
    accountManagerId: "usr_thomas",
  },
];

// ---------------------------------------------------------------------------
// Sites & chargers
// ---------------------------------------------------------------------------

interface SiteSeed {
  id: string;
  partnerId: string;
  name: string;
  address: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
  photoColor: string;
  status: Site["status"];
  electricitySource: Site["electricitySource"];
  commissionedDaysAgo: number | null;
  expectedGoLiveDays?: number;
  operatorName: string;
  chargers: { model: string; vendor: string; powerKw: number; connectors: number; type: "AC" | "DC"; status: Charger["status"]; count: number }[];
  monthly: Parameters<typeof buildMonthly>[0];
}

const SITE_SEEDS: SiteSeed[] = [
  {
    id: "site_stmalo_port",
    partnerId: "ptr_saintmalo",
    name: "Saint-Malo — Port des Bas-Sablons",
    address: "Esplanade des Bas-Sablons, 35400 Saint-Malo",
    city: "Saint-Malo",
    region: "Bretagne",
    lat: 48.6361,
    lng: -2.0257,
    photoColor: "#0B1F4D",
    status: "active",
    electricitySource: "grid_green",
    commissionedDaysAgo: 540,
    operatorName: "Watty O&M Ouest",
    chargers: [
      { model: "Terra 184", vendor: "ABB", powerKw: 150, connectors: 2, type: "DC", status: "available", count: 2 },
      { model: "HYC 50", vendor: "Alpitronic", powerKw: 50, connectors: 2, type: "DC", status: "charging", count: 1 },
    ],
    monthly: { seed: 11, months: 12, baseSessions: 1480, growth: 0.12, avgPrice: 0.42, kwhPerSession: 24, baseUptime: 0.97, dipMonths: [9] },
  },
  {
    id: "site_carrefour_cesson",
    partnerId: "ptr_carrefour",
    name: "Carrefour Cesson-Sévigné",
    address: "Centre Cial, 35510 Cesson-Sévigné",
    city: "Cesson-Sévigné",
    region: "Bretagne",
    lat: 48.1208,
    lng: -1.6021,
    photoColor: "#1E4ED8",
    status: "active",
    electricitySource: "grid",
    commissionedDaysAgo: 700,
    operatorName: "Watty O&M Ouest",
    chargers: [
      { model: "HYC 200", vendor: "Alpitronic", powerKw: 200, connectors: 2, type: "DC", status: "charging", count: 2 },
      { model: "HYC 200", vendor: "Alpitronic", powerKw: 200, connectors: 2, type: "DC", status: "faulted", count: 1 },
      { model: "Wallbox Pro", vendor: "Schneider", powerKw: 22, connectors: 1, type: "AC", status: "available", count: 2 },
    ],
    monthly: { seed: 22, months: 12, baseSessions: 2650, growth: 0.21, avgPrice: 0.39, kwhPerSession: 27, baseUptime: 0.965, dipMonths: [10, 11] },
  },
  {
    id: "site_carrefour_betton",
    partnerId: "ptr_carrefour",
    name: "Carrefour Market Betton",
    address: "Rue d'Helsinki, 35830 Betton",
    city: "Betton",
    region: "Bretagne",
    lat: 48.1809,
    lng: -1.6451,
    photoColor: "#2563EB",
    status: "active",
    electricitySource: "grid",
    commissionedDaysAgo: 320,
    operatorName: "Watty O&M Ouest",
    chargers: [
      { model: "HYC 50", vendor: "Alpitronic", powerKw: 50, connectors: 2, type: "DC", status: "available", count: 2 },
      { model: "Wallbox Pro", vendor: "Schneider", powerKw: 22, connectors: 1, type: "AC", status: "charging", count: 4 },
    ],
    monthly: { seed: 23, months: 11, baseSessions: 940, growth: 0.34, avgPrice: 0.36, kwhPerSession: 21, baseUptime: 0.98 },
  },
  {
    id: "site_oceane_nantes",
    partnerId: "ptr_mercure",
    name: "Hôtel Océane — Nantes Cité des Congrès",
    address: "5 Rue de Valmy, 44000 Nantes",
    city: "Nantes",
    region: "Pays de la Loire",
    lat: 47.2127,
    lng: -1.5436,
    photoColor: "#0B1F4D",
    status: "active",
    electricitySource: "grid_green",
    commissionedDaysAgo: 410,
    operatorName: "Watty O&M Ouest",
    chargers: [
      { model: "Terra AC", vendor: "ABB", powerKw: 22, connectors: 2, type: "AC", status: "charging", count: 6 },
      { model: "HYC 50", vendor: "Alpitronic", powerKw: 50, connectors: 2, type: "DC", status: "available", count: 1 },
    ],
    monthly: { seed: 31, months: 12, baseSessions: 760, growth: 0.08, avgPrice: 0.45, kwhPerSession: 18, baseUptime: 0.985 },
  },
  {
    id: "site_oceane_labaule",
    partnerId: "ptr_mercure",
    name: "Hôtel Océane — La Baule Front de Mer",
    address: "Av. du Général de Gaulle, 44500 La Baule",
    city: "La Baule-Escoublac",
    region: "Pays de la Loire",
    lat: 47.2861,
    lng: -2.3925,
    photoColor: "#1E3A8A",
    status: "maintenance",
    electricitySource: "grid",
    commissionedDaysAgo: 230,
    operatorName: "Watty O&M Ouest",
    chargers: [
      { model: "Terra AC", vendor: "ABB", powerKw: 22, connectors: 2, type: "AC", status: "maintenance", count: 4 },
      { model: "HYC 50", vendor: "Alpitronic", powerKw: 50, connectors: 2, type: "DC", status: "offline", count: 1 },
    ],
    monthly: { seed: 32, months: 8, baseSessions: 430, growth: 0.05, avgPrice: 0.46, kwhPerSession: 17, baseUptime: 0.9, dipMonths: [6, 7] },
  },
  {
    id: "site_fonciere_bordeaux",
    partnerId: "ptr_fonciere",
    name: "Atlantique Park — Bordeaux Lac",
    address: "Rue du Petit Barail, 33300 Bordeaux",
    city: "Bordeaux",
    region: "Nouvelle-Aquitaine",
    lat: 44.892,
    lng: -0.5701,
    photoColor: "#7C3AED",
    status: "active",
    electricitySource: "solar_hybrid",
    commissionedDaysAgo: 180,
    operatorName: "Watty O&M Sud-Ouest",
    chargers: [
      { model: "HYC 200", vendor: "Alpitronic", powerKw: 200, connectors: 2, type: "DC", status: "available", count: 2 },
      { model: "Terra 184", vendor: "ABB", powerKw: 180, connectors: 2, type: "DC", status: "charging", count: 1 },
      { model: "Wallbox Pro", vendor: "Schneider", powerKw: 22, connectors: 1, type: "AC", status: "available", count: 4 },
    ],
    monthly: { seed: 41, months: 7, baseSessions: 1280, growth: 0.4, avgPrice: 0.41, kwhPerSession: 29, baseUptime: 0.96 },
  },
  {
    id: "site_fonciere_merignac",
    partnerId: "ptr_fonciere",
    name: "Atlantique Retail — Mérignac Soleil",
    address: "Av. de la Somme, 33700 Mérignac",
    city: "Mérignac",
    region: "Nouvelle-Aquitaine",
    lat: 44.8333,
    lng: -0.6444,
    photoColor: "#6D28D9",
    status: "active",
    electricitySource: "grid",
    commissionedDaysAgo: 95,
    operatorName: "Watty O&M Sud-Ouest",
    chargers: [
      { model: "HYC 150", vendor: "Alpitronic", powerKw: 150, connectors: 2, type: "DC", status: "charging", count: 2 },
      { model: "Wallbox Pro", vendor: "Schneider", powerKw: 22, connectors: 1, type: "AC", status: "available", count: 2 },
    ],
    monthly: { seed: 42, months: 3, baseSessions: 610, growth: 0.55, avgPrice: 0.4, kwhPerSession: 26, baseUptime: 0.975 },
  },
  {
    id: "site_greenfleet_lyon",
    partnerId: "ptr_greenfleet",
    name: "Greenfleet Hub — Lyon Saint-Priest",
    address: "Rue du Dauphiné, 69800 Saint-Priest",
    city: "Saint-Priest",
    region: "Auvergne-Rhône-Alpes",
    lat: 45.6967,
    lng: 4.9444,
    photoColor: "#16A34A",
    status: "active",
    electricitySource: "grid_green",
    commissionedDaysAgo: 300,
    operatorName: "Watty O&M Est",
    chargers: [
      { model: "HYC 200", vendor: "Alpitronic", powerKw: 200, connectors: 2, type: "DC", status: "charging", count: 4 },
      { model: "Terra 184", vendor: "ABB", powerKw: 180, connectors: 2, type: "DC", status: "available", count: 2 },
    ],
    monthly: { seed: 51, months: 12, baseSessions: 3100, growth: 0.16, avgPrice: 0.34, kwhPerSession: 33, baseUptime: 0.99 },
  },
  {
    id: "site_greenfleet_valence",
    partnerId: "ptr_greenfleet",
    name: "Greenfleet Relay — Valence Sud",
    address: "ZAC des Chabasses, 26000 Valence",
    city: "Valence",
    region: "Auvergne-Rhône-Alpes",
    lat: 44.9015,
    lng: 4.8919,
    photoColor: "#15803D",
    status: "active",
    electricitySource: "grid",
    commissionedDaysAgo: 140,
    operatorName: "Watty O&M Est",
    chargers: [{ model: "HYC 200", vendor: "Alpitronic", powerKw: 200, connectors: 2, type: "DC", status: "available", count: 3 }],
    monthly: { seed: 52, months: 5, baseSessions: 1340, growth: 0.3, avgPrice: 0.35, kwhPerSession: 31, baseUptime: 0.985 },
  },
  {
    id: "site_stmalo_intramuros",
    partnerId: "ptr_saintmalo",
    name: "Saint-Malo — Parking Intra-Muros",
    address: "Place Chateaubriand, 35400 Saint-Malo",
    city: "Saint-Malo",
    region: "Bretagne",
    lat: 48.6493,
    lng: -2.0257,
    photoColor: "#0E2A6B",
    status: "active",
    electricitySource: "grid_green",
    commissionedDaysAgo: 260,
    operatorName: "Watty O&M Ouest",
    chargers: [{ model: "Terra AC", vendor: "ABB", powerKw: 22, connectors: 2, type: "AC", status: "charging", count: 8 }],
    monthly: { seed: 12, months: 9, baseSessions: 880, growth: 0.18, avgPrice: 0.4, kwhPerSession: 16, baseUptime: 0.975, dipMonths: [4] },
  },
  {
    id: "site_decathlon_blagnac",
    partnerId: "ptr_decathlon",
    name: "Decathlon Blagnac",
    address: "Av. des Ailes, 31700 Blagnac",
    city: "Blagnac",
    region: "Occitanie",
    lat: 43.6356,
    lng: 1.3936,
    photoColor: "#DC2626",
    status: "construction",
    electricitySource: "grid",
    commissionedDaysAgo: null,
    expectedGoLiveDays: 55,
    operatorName: "Watty O&M Sud-Ouest",
    chargers: [],
    monthly: { seed: 61, months: 1, baseSessions: 0, growth: 0, avgPrice: 0.4, kwhPerSession: 0, baseUptime: 1 },
  },
  {
    id: "site_decathlon_labege",
    partnerId: "ptr_decathlon",
    name: "Decathlon Labège",
    address: "Centre Cial Labège 2, 31670 Labège",
    city: "Labège",
    region: "Occitanie",
    lat: 43.5378,
    lng: 1.5169,
    photoColor: "#B91C1C",
    status: "planned",
    electricitySource: "grid",
    commissionedDaysAgo: null,
    expectedGoLiveDays: 130,
    operatorName: "Watty O&M Sud-Ouest",
    chargers: [],
    monthly: { seed: 62, months: 1, baseSessions: 0, growth: 0, avgPrice: 0.4, kwhPerSession: 0, baseUptime: 1 },
  },
];

export const chargers: Charger[] = [];
export const sites: Site[] = SITE_SEEDS.map((s) => {
  const monthly = s.chargers.length ? buildMonthly(s.monthly) : [];
  const siteChargers: Charger[] = [];
  let idx = 1;
  for (const c of s.chargers) {
    for (let i = 0; i < c.count; i++) {
      siteChargers.push({
        id: `chg_${s.id.replace("site_", "")}_${idx++}`,
        siteId: s.id,
        model: c.model,
        vendor: c.vendor,
        powerKw: c.powerKw,
        connectors: c.connectors,
        type: c.type,
        status: i === 0 ? c.status : c.status === "faulted" || c.status === "offline" ? "available" : c.status,
        commissionedAt: isoDaysAgo((s.commissionedDaysAgo ?? 0) - i * 3),
      });
    }
  }
  chargers.push(...siteChargers);
  const totalPowerKw = siteChargers.reduce((sum, c) => sum + c.powerKw, 0);
  const lastMonth = monthly.length ? last(monthly) : null;
  const sessionsPerDay = lastMonth ? Math.round(lastMonth.sessions / 30) : 0;
  return {
    id: s.id,
    organizationId: ORG_ID,
    partnerId: s.partnerId,
    name: s.name,
    address: s.address,
    city: s.city,
    region: s.region,
    country: "France",
    lat: s.lat,
    lng: s.lng,
    photoColor: s.photoColor,
    status: s.status,
    electricitySource: s.electricitySource,
    commissionedAt: s.commissionedDaysAgo != null ? isoDaysAgo(s.commissionedDaysAgo) : null,
    expectedGoLive: s.expectedGoLiveDays != null ? isoDaysAhead(s.expectedGoLiveDays) : undefined,
    operatorName: s.operatorName,
    chargerCount: siteChargers.length,
    totalPowerKw,
    monthly,
    uptimePct: lastMonth ? lastMonth.uptimePct : 1,
    sessionsPerDay,
    revenuePerMonthEur: lastMonth ? lastMonth.revenueEur : 0,
  } satisfies Site;
});

function site(id: string): Site {
  const s = sites.find((x) => x.id === id);
  if (!s) throw new Error(`unknown site ${id}`);
  return s;
}

// ---------------------------------------------------------------------------
// Maintenance providers
// ---------------------------------------------------------------------------

export const maintenanceProviders: MaintenanceProvider[] = [
  {
    id: "mp_breizh",
    organizationId: ORG_ID,
    name: "Breizh Charge Services",
    contactEmail: "ops@breizhcharge.fr",
    phone: "+33 2 99 00 11 22",
    regions: ["Bretagne", "Pays de la Loire"],
    avgResolutionHours: 31,
    rating: 4.4,
  },
  {
    id: "mp_sudelec",
    organizationId: ORG_ID,
    name: "Sud Élec Mobilité",
    contactEmail: "support@sudelec-mobilite.fr",
    phone: "+33 5 56 00 33 44",
    regions: ["Nouvelle-Aquitaine", "Occitanie"],
    avgResolutionHours: 44,
    rating: 4.0,
  },
  {
    id: "mp_rhone",
    organizationId: ORG_ID,
    name: "Rhône Power Maintenance",
    contactEmail: "intervention@rhonepower.fr",
    phone: "+33 4 72 00 55 66",
    regions: ["Auvergne-Rhône-Alpes"],
    avgResolutionHours: 27,
    rating: 4.6,
  },
];

// ---------------------------------------------------------------------------
// Incidents
// ---------------------------------------------------------------------------

export const incidents: Incident[] = [
  {
    id: "inc_001",
    organizationId: ORG_ID,
    siteId: "site_carrefour_cesson",
    chargerId: "chg_carrefour_cesson_3",
    title: "DC charger 3 — power module fault (E-0042)",
    description:
      "Charger reporting internal power module error after a session abort. Remote reset unsuccessful. One of three HPC units affected; site remains operational at reduced capacity.",
    category: "hardware_fault",
    status: "waiting_external",
    severity: "high",
    openedAt: isoDaysAgo(4, 7),
    slaDueAt: isoDaysAgo(-1, 18),
    maintenanceProviderId: "mp_breizh",
    etaAt: isoDaysAhead(2),
    photoColors: ["#1E4ED8", "#94A3B8"],
    timeline: [
      { at: isoDaysAgo(4, 7), label: "Incident auto-detected from OCPP fault code", by: "PartnerOS Monitoring" },
      { at: isoDaysAgo(4, 8), label: "Remote reset attempted — failed", by: "Thomas Mercier" },
      { at: isoDaysAgo(4, 9), label: "Dispatched to Breizh Charge Services", by: "Thomas Mercier" },
      { at: isoDaysAgo(3, 14), label: "Provider diagnosed faulty power module — part ordered", by: "Breizh Charge Services" },
      { at: isoDaysAgo(1, 10), label: "ETA confirmed for replacement", by: "Breizh Charge Services" },
    ],
  },
  {
    id: "inc_002",
    organizationId: ORG_ID,
    siteId: "site_oceane_labaule",
    title: "Cable theft — two AC cables cut overnight",
    description:
      "Vandalism / cable theft reported by hotel staff. Two Type-2 cables severed. Police report filed. Site put into maintenance status; replacement cables and tamper guards required.",
    category: "cable_theft",
    status: "scheduled",
    severity: "high",
    openedAt: isoDaysAgo(9, 6),
    slaDueAt: isoDaysAgo(-3, 18),
    maintenanceProviderId: "mp_breizh",
    etaAt: isoDaysAhead(3),
    photoColors: ["#1E3A8A", "#64748B", "#94A3B8"],
    timeline: [
      { at: isoDaysAgo(9, 6), label: "Reported by hotel front desk", by: "Julien Caron" },
      { at: isoDaysAgo(9, 8), label: "Site set to maintenance; sessions disabled", by: "Thomas Mercier" },
      { at: isoDaysAgo(8, 11), label: "Police report filed; insurance claim opened", by: "Camille Laurent" },
      { at: isoDaysAgo(6, 15), label: "Replacement cables + anti-theft guards ordered", by: "Breizh Charge Services" },
      { at: isoDaysAgo(2, 9), label: "Intervention scheduled", by: "Breizh Charge Services" },
    ],
  },
  {
    id: "inc_003",
    organizationId: ORG_ID,
    siteId: "site_stmalo_port",
    title: "Connectivity loss — 4G modem on HYC 50",
    description: "Charger offline due to SIM/modem connectivity issue. No charging impact (other units online).",
    category: "connectivity",
    status: "in_progress",
    severity: "medium",
    openedAt: isoDaysAgo(2, 13),
    slaDueAt: isoDaysAhead(2),
    maintenanceProviderId: "mp_breizh",
    etaAt: isoDaysAhead(1),
    photoColors: ["#0B1F4D"],
    timeline: [
      { at: isoDaysAgo(2, 13), label: "Charger lost backend connectivity", by: "PartnerOS Monitoring" },
      { at: isoDaysAgo(2, 14), label: "Remote SIM reset attempted", by: "Thomas Mercier" },
      { at: isoDaysAgo(1, 9), label: "Field technician scheduled to swap modem", by: "Breizh Charge Services" },
    ],
  },
  {
    id: "inc_004",
    organizationId: ORG_ID,
    siteId: "site_fonciere_merignac",
    title: "Payment terminal rejecting contactless cards",
    description: "Site reports intermittent card payment failures on AC bay 2. App payments unaffected.",
    category: "payment_terminal",
    status: "open",
    severity: "medium",
    openedAt: isoDaysAgo(1, 16),
    slaDueAt: isoDaysAhead(3),
    photoColors: ["#6D28D9"],
    timeline: [{ at: isoDaysAgo(1, 16), label: "Reported via partner portal", by: "Marc Lefèvre" }],
  },
  {
    id: "inc_005",
    organizationId: ORG_ID,
    siteId: "site_greenfleet_lyon",
    title: "Scheduled firmware upgrade — HPC fleet",
    description: "Vendor firmware rollout to address charging-curve optimisation. Two-hour maintenance window planned overnight.",
    category: "software",
    status: "scheduled",
    severity: "low",
    openedAt: isoDaysAgo(3, 10),
    slaDueAt: isoDaysAhead(5),
    maintenanceProviderId: "mp_rhone",
    etaAt: isoDaysAhead(4),
    photoColors: ["#16A34A"],
    timeline: [
      { at: isoDaysAgo(3, 10), label: "Maintenance window requested by vendor", by: "Rhône Power Maintenance" },
      { at: isoDaysAgo(2, 11), label: "Window approved; partner notified", by: "Thomas Mercier" },
    ],
  },
  {
    id: "inc_006",
    organizationId: ORG_ID,
    siteId: "site_carrefour_cesson",
    title: "AC bay GFCI trip",
    description: "Ground-fault protection tripped on AC wallbox; reset by site staff. Monitoring for recurrence.",
    category: "power_supply",
    status: "resolved",
    severity: "low",
    openedAt: isoDaysAgo(21, 8),
    resolvedAt: isoDaysAgo(20, 12),
    slaDueAt: isoDaysAgo(18, 18),
    photoColors: ["#1E4ED8"],
    timeline: [
      { at: isoDaysAgo(21, 8), label: "GFCI trip detected", by: "PartnerOS Monitoring" },
      { at: isoDaysAgo(21, 9), label: "Site staff reset breaker", by: "Carrefour Cesson facilities" },
      { at: isoDaysAgo(20, 12), label: "No recurrence after 24h — resolved", by: "Thomas Mercier" },
    ],
  },
  {
    id: "inc_007",
    organizationId: ORG_ID,
    siteId: "site_stmalo_port",
    title: "HPC unit overheating — derating in heatwave",
    description: "Unit derated charging power during high ambient temperatures. Recovered automatically; flagged for shading review.",
    category: "hardware_fault",
    status: "resolved",
    severity: "low",
    openedAt: isoDaysAgo(38, 14),
    resolvedAt: isoDaysAgo(37, 10),
    slaDueAt: isoDaysAgo(35, 18),
    photoColors: ["#0B1F4D"],
    timeline: [
      { at: isoDaysAgo(38, 14), label: "Thermal derating reported", by: "PartnerOS Monitoring" },
      { at: isoDaysAgo(37, 10), label: "Temperatures normalised; full power restored", by: "PartnerOS Monitoring" },
    ],
  },
  {
    id: "inc_008",
    organizationId: ORG_ID,
    siteId: "site_oceane_labaule",
    title: "DC unit offline pending cable replacement",
    description: "HYC 50 unit kept offline while the site is in maintenance following the cable-theft incident.",
    category: "vandalism",
    status: "in_progress",
    severity: "medium",
    openedAt: isoDaysAgo(9, 7),
    slaDueAt: isoDaysAhead(3),
    maintenanceProviderId: "mp_breizh",
    etaAt: isoDaysAhead(3),
    photoColors: ["#1E3A8A"],
    timeline: [
      { at: isoDaysAgo(9, 7), label: "Unit disabled alongside cable-theft response", by: "Thomas Mercier" },
      { at: isoDaysAgo(2, 9), label: "Re-commissioning bundled with scheduled intervention", by: "Breizh Charge Services" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Benchmarks
// ---------------------------------------------------------------------------

function benchmarkFor(siteId: string, ourPrice: number, ourMaxPower: number, ourUtil: number, comps: SiteBenchmark["competitors"], share: number): SiteBenchmark {
  const avgComp = comps.length ? comps.reduce((s, c) => s + c.priceEurKwh, 0) / comps.length : ourPrice;
  const gap = (ourPrice - avgComp) / avgComp;
  const position: SiteBenchmark["position"] = comps.length === 0 ? "unknown" : gap < -0.05 ? "underpriced" : gap > 0.05 ? "overpriced" : "aligned";
  return { siteId, ourPriceEurKwh: ourPrice, ourMaxPowerKw: ourMaxPower, ourUtilizationPct: ourUtil, competitors: comps, marketSharePct: share, position };
}

export const benchmarks: SiteBenchmark[] = [
  benchmarkFor(
    "site_stmalo_port",
    last(site("site_stmalo_port").monthly).avgPriceEurKwh,
    150,
    0.31,
    [
      { brand: "TotalEnergies", distanceKm: 1.4, maxPowerKw: 175, priceEurKwh: 0.49, estimatedUtilizationPct: 0.27 },
      { brand: "Electra", distanceKm: 2.1, maxPowerKw: 150, priceEurKwh: 0.45, estimatedUtilizationPct: 0.34 },
      { brand: "Allego", distanceKm: 3.6, maxPowerKw: 150, priceEurKwh: 0.47, estimatedUtilizationPct: 0.22 },
    ],
    0.38,
  ),
  benchmarkFor(
    "site_carrefour_cesson",
    last(site("site_carrefour_cesson").monthly).avgPriceEurKwh,
    200,
    0.41,
    [
      { brand: "Tesla Supercharger", distanceKm: 2.8, maxPowerKw: 250, priceEurKwh: 0.43, estimatedUtilizationPct: 0.46 },
      { brand: "Ionity", distanceKm: 4.2, maxPowerKw: 350, priceEurKwh: 0.59, estimatedUtilizationPct: 0.31 },
      { brand: "Fastned", distanceKm: 5.0, maxPowerKw: 300, priceEurKwh: 0.55, estimatedUtilizationPct: 0.29 },
    ],
    0.34,
  ),
  benchmarkFor(
    "site_carrefour_betton",
    last(site("site_carrefour_betton").monthly).avgPriceEurKwh,
    50,
    0.24,
    [
      { brand: "Power Dot", distanceKm: 1.1, maxPowerKw: 60, priceEurKwh: 0.39, estimatedUtilizationPct: 0.21 },
      { brand: "Engie Vianeo", distanceKm: 3.2, maxPowerKw: 150, priceEurKwh: 0.45, estimatedUtilizationPct: 0.18 },
    ],
    0.42,
  ),
  benchmarkFor(
    "site_oceane_nantes",
    last(site("site_oceane_nantes").monthly).avgPriceEurKwh,
    50,
    0.19,
    [
      { brand: "TotalEnergies", distanceKm: 0.8, maxPowerKw: 50, priceEurKwh: 0.5, estimatedUtilizationPct: 0.22 },
      { brand: "Electra", distanceKm: 1.6, maxPowerKw: 150, priceEurKwh: 0.45, estimatedUtilizationPct: 0.3 },
    ],
    0.28,
  ),
  benchmarkFor(
    "site_oceane_labaule",
    last(site("site_oceane_labaule").monthly).avgPriceEurKwh,
    50,
    0.14,
    [{ brand: "TotalEnergies", distanceKm: 1.2, maxPowerKw: 50, priceEurKwh: 0.49, estimatedUtilizationPct: 0.16 }],
    0.31,
  ),
  benchmarkFor(
    "site_fonciere_bordeaux",
    last(site("site_fonciere_bordeaux").monthly).avgPriceEurKwh,
    200,
    0.36,
    [
      { brand: "Fastned", distanceKm: 2.3, maxPowerKw: 300, priceEurKwh: 0.55, estimatedUtilizationPct: 0.33 },
      { brand: "Electra", distanceKm: 1.9, maxPowerKw: 150, priceEurKwh: 0.43, estimatedUtilizationPct: 0.39 },
      { brand: "TotalEnergies", distanceKm: 3.4, maxPowerKw: 175, priceEurKwh: 0.49, estimatedUtilizationPct: 0.28 },
    ],
    0.3,
  ),
  benchmarkFor(
    "site_fonciere_merignac",
    last(site("site_fonciere_merignac").monthly).avgPriceEurKwh,
    150,
    0.3,
    [
      { brand: "Allego", distanceKm: 1.0, maxPowerKw: 150, priceEurKwh: 0.47, estimatedUtilizationPct: 0.26 },
      { brand: "Electra", distanceKm: 2.5, maxPowerKw: 150, priceEurKwh: 0.43, estimatedUtilizationPct: 0.35 },
    ],
    0.33,
  ),
  benchmarkFor(
    "site_greenfleet_lyon",
    last(site("site_greenfleet_lyon").monthly).avgPriceEurKwh,
    200,
    0.52,
    [
      { brand: "Ionity", distanceKm: 6.0, maxPowerKw: 350, priceEurKwh: 0.59, estimatedUtilizationPct: 0.3 },
      { brand: "TotalEnergies", distanceKm: 2.2, maxPowerKw: 175, priceEurKwh: 0.49, estimatedUtilizationPct: 0.36 },
    ],
    0.41,
  ),
  benchmarkFor(
    "site_greenfleet_valence",
    last(site("site_greenfleet_valence").monthly).avgPriceEurKwh,
    200,
    0.45,
    [{ brand: "Fastned", distanceKm: 3.1, maxPowerKw: 300, priceEurKwh: 0.55, estimatedUtilizationPct: 0.34 }],
    0.36,
  ),
  benchmarkFor(
    "site_stmalo_intramuros",
    last(site("site_stmalo_intramuros").monthly).avgPriceEurKwh,
    22,
    0.22,
    [{ brand: "Electra", distanceKm: 0.9, maxPowerKw: 150, priceEurKwh: 0.45, estimatedUtilizationPct: 0.28 }],
    0.3,
  ),
];

// ---------------------------------------------------------------------------
// Documents & contracts
// ---------------------------------------------------------------------------

export const documents: DocumentItem[] = [
  { id: "doc_c1", organizationId: ORG_ID, partnerId: "ptr_carrefour", name: "Framework Agreement — Carrefour Bretagne (2022).pdf", kind: "contract", sizeKb: 842, uploadedAt: "2022-05-20T10:00:00Z", uploadedBy: "Camille Laurent", url: "/files/doc_c1.pdf" },
  { id: "doc_c2", organizationId: ORG_ID, partnerId: "ptr_carrefour", name: "Amendment 1 — Betton site addition.pdf", kind: "amendment", sizeKb: 311, uploadedAt: "2024-12-10T10:00:00Z", uploadedBy: "Thomas Mercier", url: "/files/doc_c2.pdf" },
  { id: "doc_c3", organizationId: ORG_ID, partnerId: "ptr_carrefour", siteId: "site_carrefour_cesson", name: "Site dossier — Cesson-Sévigné (technical).pdf", kind: "technical", sizeKb: 1980, uploadedAt: "2023-01-15T10:00:00Z", uploadedBy: "Watty Engineering", url: "/files/doc_c3.pdf" },
  { id: "doc_c4", organizationId: ORG_ID, partnerId: "ptr_carrefour", name: "Invoice 2026-04 — Carrefour Bretagne.pdf", kind: "invoice", sizeKb: 122, uploadedAt: isoDaysAgo(9), uploadedBy: "Watty Finance", url: "/files/doc_c4.pdf" },
  { id: "doc_m1", organizationId: ORG_ID, partnerId: "ptr_mercure", name: "Framework Agreement — Hôtels Océane Ouest.pdf", kind: "contract", sizeKb: 770, uploadedAt: "2023-02-01T10:00:00Z", uploadedBy: "Camille Laurent", url: "/files/doc_m1.pdf" },
  { id: "doc_m2", organizationId: ORG_ID, partnerId: "ptr_mercure", siteId: "site_oceane_labaule", name: "Police report — cable theft La Baule.pdf", kind: "other", sizeKb: 230, uploadedAt: isoDaysAgo(8), uploadedBy: "Camille Laurent", url: "/files/doc_m2.pdf" },
  { id: "doc_f1", organizationId: ORG_ID, partnerId: "ptr_fonciere", name: "Framework Agreement — Foncière Atlantique.pdf", kind: "contract", sizeKb: 905, uploadedAt: "2023-08-25T10:00:00Z", uploadedBy: "Camille Laurent", url: "/files/doc_f1.pdf" },
  { id: "doc_f2", organizationId: ORG_ID, partnerId: "ptr_fonciere", siteId: "site_fonciere_merignac", name: "Building permit — Mérignac Soleil.pdf", kind: "permit", sizeKb: 540, uploadedAt: "2025-08-12T10:00:00Z", uploadedBy: "Watty Deployment", url: "/files/doc_f2.pdf" },
  { id: "doc_g1", organizationId: ORG_ID, partnerId: "ptr_greenfleet", name: "Fleet Charging Agreement — Greenfleet.pdf", kind: "contract", sizeKb: 680, uploadedAt: "2024-01-05T10:00:00Z", uploadedBy: "Camille Laurent", url: "/files/doc_g1.pdf" },
  { id: "doc_g2", organizationId: ORG_ID, partnerId: "ptr_greenfleet", siteId: "site_greenfleet_valence", name: "Grid connection certificate — Valence Sud.pdf", kind: "permit", sizeKb: 410, uploadedAt: "2025-12-02T10:00:00Z", uploadedBy: "Enedis", url: "/files/doc_g2.pdf" },
  { id: "doc_s1", organizationId: ORG_ID, partnerId: "ptr_saintmalo", name: "Concession Agreement — Ville de Saint-Malo.pdf", kind: "contract", sizeKb: 1120, uploadedAt: "2022-11-15T10:00:00Z", uploadedBy: "Camille Laurent", url: "/files/doc_s1.pdf" },
  { id: "doc_d1", organizationId: ORG_ID, partnerId: "ptr_decathlon", name: "Framework Agreement — Decathlon Sud-Ouest (draft).pdf", kind: "contract", sizeKb: 612, uploadedAt: isoDaysAgo(15), uploadedBy: "Camille Laurent", url: "/files/doc_d1.pdf" },
  { id: "doc_d2", organizationId: ORG_ID, partnerId: "ptr_decathlon", siteId: "site_decathlon_blagnac", name: "Building permit application — Blagnac.pdf", kind: "permit", sizeKb: 480, uploadedAt: isoDaysAgo(40), uploadedBy: "Watty Deployment", url: "/files/doc_d2.pdf" },
  { id: "doc_r1", organizationId: ORG_ID, partnerId: "ptr_carrefour", name: "Monthly Partner Report — 2026-04 — Carrefour.pdf", kind: "report", sizeKb: 1450, uploadedAt: isoDaysAgo(9), uploadedBy: "PartnerOS", url: "/files/doc_r1.pdf" },
  { id: "doc_r2", organizationId: ORG_ID, partnerId: "ptr_greenfleet", name: "Monthly Partner Report — 2026-04 — Greenfleet.pdf", kind: "report", sizeKb: 1380, uploadedAt: isoDaysAgo(9), uploadedBy: "PartnerOS", url: "/files/doc_r2.pdf" },
  { id: "doc_d3", organizationId: ORG_ID, partnerId: "ptr_decathlon", siteId: "site_decathlon_blagnac", name: "Electrical single-line diagram — Blagnac.pdf", kind: "technical", sizeKb: 2100, uploadedAt: isoDaysAgo(20), uploadedBy: "Watty Engineering", url: "/files/doc_d3.pdf" },
];

export const contracts: Contract[] = [
  { id: "ctr_carrefour", organizationId: ORG_ID, partnerId: "ptr_carrefour", title: "Framework Charging Agreement", type: "framework", status: "active", startsAt: "2022-06-01", endsAt: "2027-05-31", royaltyRate: 0.18, documentId: "doc_c1", signedBy: "Sophie Berthier" },
  { id: "ctr_carrefour_a1", organizationId: ORG_ID, partnerId: "ptr_carrefour", title: "Amendment 1 — Betton site", type: "amendment", status: "active", startsAt: "2024-12-15", endsAt: "2027-05-31", royaltyRate: 0.18, documentId: "doc_c2", signedBy: "Sophie Berthier" },
  { id: "ctr_mercure", organizationId: ORG_ID, partnerId: "ptr_mercure", title: "Hospitality Charging Agreement", type: "framework", status: "active", startsAt: "2023-02-15", endsAt: "2028-02-14", royaltyRate: 0.15, documentId: "doc_m1", signedBy: "Julien Caron" },
  { id: "ctr_fonciere", organizationId: ORG_ID, partnerId: "ptr_fonciere", title: "Real-Estate Charging Agreement", type: "framework", status: "active", startsAt: "2023-09-01", endsAt: "2030-08-31", royaltyRate: 0.2, documentId: "doc_f1", signedBy: "Marc Lefèvre" },
  { id: "ctr_greenfleet", organizationId: ORG_ID, partnerId: "ptr_greenfleet", title: "Fleet Depot Charging Agreement", type: "framework", status: "active", startsAt: "2024-01-10", endsAt: "2029-01-09", royaltyRate: 0.12, documentId: "doc_g1", signedBy: "Aurélie Dupont" },
  { id: "ctr_saintmalo", organizationId: ORG_ID, partnerId: "ptr_saintmalo", title: "Public Charging Concession", type: "framework", status: "active", startsAt: "2022-11-20", endsAt: "2032-11-19", royaltyRate: 0.1, documentId: "doc_s1", signedBy: "Hélène Morvan" },
  { id: "ctr_decathlon", organizationId: ORG_ID, partnerId: "ptr_decathlon", title: "Framework Charging Agreement", type: "framework", status: "pending_signature", startsAt: "2025-09-01", endsAt: "2030-08-31", royaltyRate: 0.16, documentId: "doc_d1" },
];

// ---------------------------------------------------------------------------
// Revenue reports / royalties
// ---------------------------------------------------------------------------

function buildReports(): RevenueReport[] {
  const reports: RevenueReport[] = [];
  const monthsBack = [3, 2, 1]; // Feb, Mar, Apr 2026 relative to May
  for (const partner of partners) {
    const partnerSites = sites.filter((s) => s.partnerId === partner.id && s.monthly.length);
    if (!partnerSites.length) continue;
    for (const mb of monthsBack) {
      const mKey = monthKey(-mb);
      const siteIds: string[] = [];
      let gross = 0;
      let energy = 0;
      for (const s of partnerSites) {
        const m = s.monthly.find((x) => x.month === mKey);
        if (!m) continue;
        siteIds.push(s.id);
        gross += m.revenueEur;
        energy += Math.round(m.energyKwh * 0.16); // assumed wholesale electricity cost ~0.16 €/kWh
      }
      if (!siteIds.length) continue;
      const platformFee = Math.round(gross * 0.05);
      const netBase = gross - energy - platformFee;
      const royalty = Math.round(netBase * partner.royaltyRate);
      const isLatest = mb === 1;
      const discrepancy =
        partner.id === "ptr_mercure" && isLatest
          ? { detected: true, note: "La Baule revenue down 38% vs prior month due to the cable-theft maintenance window — flagged so the partner understands the dip before the statement lands." }
          : undefined;
      reports.push({
        id: `rep_${partner.id}_${mKey}`,
        organizationId: ORG_ID,
        partnerId: partner.id,
        month: mKey,
        siteIds,
        grossRevenueEur: gross,
        energyCostEur: energy,
        platformFeeEur: platformFee,
        royaltyEur: royalty,
        lines: [
          { label: "Gross charging revenue", amountEur: gross, kind: "gross_revenue" },
          { label: "Electricity supply cost", amountEur: -energy, kind: "energy_cost" },
          { label: "Platform & operations fee (5%)", amountEur: -platformFee, kind: "platform_fee" },
          ...(discrepancy ? [{ label: "Service credit — La Baule downtime", amountEur: 180, kind: "adjustment" as const }] : []),
          { label: `Partner revenue share (${Math.round(partner.royaltyRate * 100)}%)`, amountEur: royalty + (discrepancy ? 180 : 0), kind: "royalty" as const },
        ],
        status: isLatest ? "issued" : "paid",
        issuedAt: isoDaysAgo(mb === 1 ? 9 : mb === 2 ? 39 : 68),
        paidAt: isLatest ? undefined : isoDaysAgo(mb === 2 ? 25 : 54),
        discrepancy,
      });
    }
  }
  return reports;
}

export const revenueReports: RevenueReport[] = buildReports();

// ---------------------------------------------------------------------------
// Deployments
// ---------------------------------------------------------------------------

function milestone(stage: import("./types").DeploymentStage, label: string, status: import("./types").DeploymentMilestone["status"], plannedDaysFromNow: number, completedDaysAgo?: number, note?: string): import("./types").DeploymentMilestone {
  return { stage, label, status, plannedAt: isoDaysAhead(plannedDaysFromNow), completedAt: completedDaysAgo != null ? isoDaysAgo(completedDaysAgo) : undefined, note };
}

export const deployments: Deployment[] = [
  {
    id: "dep_decathlon_blagnac",
    organizationId: ORG_ID,
    partnerId: "ptr_decathlon",
    siteId: "site_decathlon_blagnac",
    name: "Decathlon Blagnac — 4× DC fast chargers",
    city: "Blagnac",
    region: "Occitanie",
    progress: 0.55,
    expectedGoLive: isoDaysAhead(55),
    delayed: true,
    delayReason: "Grid connection (Enedis) slot pushed back ~3 weeks; civil works re-sequenced to compensate.",
    plannedChargers: 4,
    plannedPowerKw: 600,
    milestones: [
      milestone("site_survey", "Site survey & layout", "done", -120, 120),
      milestone("permitting", "Building permit", "done", -70, 62),
      milestone("grid_connection", "Grid connection (Enedis)", "in_progress", 18, undefined, "Connection works rescheduled; energisation slot confirmed."),
      milestone("civil_works", "Civil works & trenching", "in_progress", 12, undefined, "Foundations poured; cabling in progress."),
      milestone("equipment_delivery", "Charger delivery (Alpitronic)", "pending", 30),
      milestone("installation", "Installation & wiring", "pending", 42),
      milestone("commissioning", "Commissioning & testing", "pending", 50),
      milestone("go_live", "Go-live", "pending", 55),
    ],
    documentIds: ["doc_d2", "doc_d3"],
  },
  {
    id: "dep_decathlon_labege",
    organizationId: ORG_ID,
    partnerId: "ptr_decathlon",
    siteId: "site_decathlon_labege",
    name: "Decathlon Labège — 6× DC + 4× AC",
    city: "Labège",
    region: "Occitanie",
    progress: 0.12,
    expectedGoLive: isoDaysAhead(130),
    delayed: false,
    plannedChargers: 10,
    plannedPowerKw: 700,
    milestones: [
      milestone("site_survey", "Site survey & layout", "done", -20, 14),
      milestone("permitting", "Building permit", "in_progress", 25),
      milestone("grid_connection", "Grid connection (Enedis)", "pending", 60),
      milestone("civil_works", "Civil works & trenching", "pending", 85),
      milestone("equipment_delivery", "Charger delivery", "pending", 95),
      milestone("installation", "Installation & wiring", "pending", 110),
      milestone("commissioning", "Commissioning & testing", "pending", 122),
      milestone("go_live", "Go-live", "pending", 130),
    ],
    documentIds: [],
  },
  {
    id: "dep_fonciere_merignac",
    organizationId: ORG_ID,
    partnerId: "ptr_fonciere",
    siteId: "site_fonciere_merignac",
    name: "Atlantique Retail Mérignac — capacity expansion",
    city: "Mérignac",
    region: "Nouvelle-Aquitaine",
    progress: 0.92,
    expectedGoLive: isoDaysAhead(8),
    delayed: false,
    plannedChargers: 2,
    plannedPowerKw: 300,
    milestones: [
      milestone("site_survey", "Site survey", "done", -90, 90),
      milestone("permitting", "Permit", "done", -75, 70),
      milestone("grid_connection", "Grid upgrade", "done", -30, 28),
      milestone("civil_works", "Civil works", "done", -20, 18),
      milestone("equipment_delivery", "Charger delivery", "done", -10, 9),
      milestone("installation", "Installation", "done", -3, 2),
      milestone("commissioning", "Commissioning & testing", "in_progress", 5),
      milestone("go_live", "Go-live", "pending", 8),
    ],
    documentIds: ["doc_f2"],
  },
  {
    id: "dep_greenfleet_valence_p2",
    organizationId: ORG_ID,
    partnerId: "ptr_greenfleet",
    siteId: "site_greenfleet_valence",
    name: "Greenfleet Valence — phase 2 (+3 HPC bays)",
    city: "Valence",
    region: "Auvergne-Rhône-Alpes",
    progress: 0.3,
    expectedGoLive: isoDaysAhead(75),
    delayed: false,
    plannedChargers: 3,
    plannedPowerKw: 600,
    milestones: [
      milestone("site_survey", "Site survey", "done", -30, 24),
      milestone("permitting", "Permit", "done", -10, 6),
      milestone("grid_connection", "Grid capacity uprate", "in_progress", 30),
      milestone("civil_works", "Civil works", "pending", 45),
      milestone("equipment_delivery", "Charger delivery", "pending", 55),
      milestone("installation", "Installation", "pending", 65),
      milestone("commissioning", "Commissioning & testing", "pending", 72),
      milestone("go_live", "Go-live", "pending", 75),
    ],
    documentIds: ["doc_g2"],
  },
];

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

export const campaigns: Campaign[] = [
  {
    id: "cmp_carrefour_summer",
    organizationId: ORG_ID,
    partnerId: "ptr_carrefour",
    name: "Carrefour Summer Roadtrip — 15% off",
    type: "session_discount",
    status: "active",
    startsAt: isoDaysAgo(12),
    endsAt: isoDaysAhead(20),
    siteIds: ["site_carrefour_cesson", "site_carrefour_betton"],
    promoCode: "CARREFOUR15",
    discountPct: 0.15,
    sessionsGenerated: 412,
    promoRedemptions: 286,
    estimatedUpliftPct: 0.18,
    budgetEur: 3500,
  },
  {
    id: "cmp_oceane_reopen",
    organizationId: ORG_ID,
    partnerId: "ptr_mercure",
    name: "La Baule Reopening — guests charge free for 2 weeks",
    type: "reopening",
    status: "scheduled",
    startsAt: isoDaysAhead(4),
    endsAt: isoDaysAhead(18),
    siteIds: ["site_oceane_labaule"],
    discountPct: 1.0,
    sessionsGenerated: 0,
    promoRedemptions: 0,
    estimatedUpliftPct: 0.4,
    budgetEur: 1200,
  },
  {
    id: "cmp_greenfleet_onboard",
    organizationId: ORG_ID,
    partnerId: "ptr_greenfleet",
    name: "Greenfleet Driver Onboarding — fleet rate",
    type: "fleet",
    status: "active",
    startsAt: isoDaysAgo(45),
    endsAt: isoDaysAhead(45),
    siteIds: ["site_greenfleet_lyon", "site_greenfleet_valence"],
    promoCode: "FLEET-GF",
    discountPct: 0.08,
    sessionsGenerated: 1840,
    promoRedemptions: 1612,
    estimatedUpliftPct: 0.12,
    budgetEur: 9000,
  },
  {
    id: "cmp_fonciere_launch",
    organizationId: ORG_ID,
    partnerId: "ptr_fonciere",
    name: "Bordeaux Lac Launch — 10% off first month",
    type: "onboarding",
    status: "completed",
    startsAt: isoDaysAgo(170),
    endsAt: isoDaysAgo(140),
    siteIds: ["site_fonciere_bordeaux"],
    promoCode: "BDXLAC10",
    discountPct: 0.1,
    sessionsGenerated: 980,
    promoRedemptions: 760,
    estimatedUpliftPct: 0.22,
    budgetEur: 2500,
  },
  {
    id: "cmp_saintmalo_offpeak",
    organizationId: ORG_ID,
    partnerId: "ptr_saintmalo",
    name: "Saint-Malo Off-Peak — 20% off 22:00–07:00",
    type: "session_discount",
    status: "active",
    startsAt: isoDaysAgo(30),
    endsAt: isoDaysAhead(60),
    siteIds: ["site_stmalo_port", "site_stmalo_intramuros"],
    promoCode: "MALONIGHT",
    discountPct: 0.2,
    sessionsGenerated: 540,
    promoRedemptions: 388,
    estimatedUpliftPct: 0.09,
    budgetEur: 2000,
  },
  {
    id: "cmp_decathlon_promo",
    organizationId: ORG_ID,
    partnerId: "ptr_decathlon",
    name: "Decathlon Blagnac Pre-Launch Promo Code",
    type: "promo_code",
    status: "draft",
    startsAt: isoDaysAhead(50),
    endsAt: isoDaysAhead(80),
    siteIds: ["site_decathlon_blagnac"],
    promoCode: "DKTBLAGNAC",
    discountPct: 0.15,
    sessionsGenerated: 0,
    promoRedemptions: 0,
    estimatedUpliftPct: 0.2,
    budgetEur: 2800,
  },
];

// ---------------------------------------------------------------------------
// Notifications / Alerts Center
// ---------------------------------------------------------------------------

export const notifications: Notification[] = [
  {
    id: "ntf_001",
    organizationId: ORG_ID,
    type: "unresolved_incident",
    severity: "critical",
    title: "SLA risk — Cesson-Sévigné HPC fault",
    body: "Power-module replacement is past its 72h SLA target. Provider ETA is in 2 days. Consider proactively updating Carrefour.",
    createdAt: isoDaysAgo(0, 8),
    read: false,
    partnerId: "ptr_carrefour",
    siteId: "site_carrefour_cesson",
    href: "/incidents",
  },
  {
    id: "ntf_002",
    organizationId: ORG_ID,
    type: "partner_inactivity",
    severity: "warning",
    title: "Foncière Atlantique — no contact in 47 days",
    body: "Last logged communication with Marc Lefèvre was 47 days ago. A quarterly check-in is overdue.",
    createdAt: isoDaysAgo(0, 7),
    read: false,
    partnerId: "ptr_fonciere",
    href: "/partners/ptr_fonciere",
  },
  {
    id: "ntf_003",
    organizationId: ORG_ID,
    type: "uptime_drop",
    severity: "warning",
    title: "Uptime dip — La Baule (90%)",
    body: "La Baule rolling uptime dropped to ~90% during the cable-theft maintenance window. Reopening campaign is scheduled.",
    createdAt: isoDaysAgo(1, 9),
    read: false,
    partnerId: "ptr_mercure",
    siteId: "site_oceane_labaule",
    href: "/sites/site_oceane_labaule",
  },
  {
    id: "ntf_004",
    organizationId: ORG_ID,
    type: "discrepancy",
    severity: "warning",
    title: "Revenue discrepancy flagged — Hôtels Océane (April)",
    body: "April royalty statement includes a 38% revenue dip at La Baule. A service credit of €180 has been applied; partner should be briefed before the statement is sent.",
    createdAt: isoDaysAgo(1, 11),
    read: false,
    partnerId: "ptr_mercure",
    href: "/revenues",
  },
  {
    id: "ntf_005",
    organizationId: ORG_ID,
    type: "deployment_delay",
    severity: "warning",
    title: "Deployment delay — Decathlon Blagnac",
    body: "Grid connection slot pushed back ~3 weeks. Expected go-live re-baselined; civil works re-sequenced to limit slippage.",
    createdAt: isoDaysAgo(2, 10),
    read: true,
    partnerId: "ptr_decathlon",
    siteId: "site_decathlon_blagnac",
    href: "/deployments",
  },
  {
    id: "ntf_006",
    organizationId: ORG_ID,
    type: "utilization_opportunity",
    severity: "opportunity",
    title: "Low utilization vs competitors — La Baule",
    body: "La Baule utilization (~14%) is well below nearby TotalEnergies (~16%) and the network average. A reopening campaign could lift sessions ~40%.",
    createdAt: isoDaysAgo(2, 13),
    read: false,
    partnerId: "ptr_mercure",
    siteId: "site_oceane_labaule",
    href: "/campaigns",
  },
  {
    id: "ntf_007",
    organizationId: ORG_ID,
    type: "charger_offline",
    severity: "warning",
    title: "Charger offline — Saint-Malo Port (HYC 50)",
    body: "One DC unit offline due to a 4G modem fault. No charging impact; technician scheduled tomorrow.",
    createdAt: isoDaysAgo(2, 14),
    read: true,
    partnerId: "ptr_saintmalo",
    siteId: "site_stmalo_port",
    href: "/incidents",
  },
  {
    id: "ntf_008",
    organizationId: ORG_ID,
    type: "utilization_opportunity",
    severity: "opportunity",
    title: "High demand — Greenfleet Lyon (52% utilization)",
    body: "Lyon Saint-Priest is running at 52% utilization with frequent queueing at peak. Strong candidate for the phase-2 capacity expansion already scoped at Valence.",
    createdAt: isoDaysAgo(3, 9),
    read: true,
    partnerId: "ptr_greenfleet",
    siteId: "site_greenfleet_lyon",
    href: "/sites/site_greenfleet_lyon",
  },
  {
    id: "ntf_009",
    organizationId: ORG_ID,
    type: "missing_invoice",
    severity: "info",
    title: "April statements issued — 5 partners",
    body: "April 2026 royalty statements have been issued. Greenfleet and Carrefour invoices are awaiting payment confirmation.",
    createdAt: isoDaysAgo(9, 10),
    read: true,
    href: "/revenues",
  },
  {
    id: "ntf_010",
    organizationId: ORG_ID,
    type: "revenue_decline",
    severity: "info",
    title: "Revenue trend — Hôtel Océane Nantes flat MoM",
    body: "Nantes revenue is roughly flat month-over-month; utilization sits around 19%. Worth discussing signage and on-site comms at the next review.",
    createdAt: isoDaysAgo(6, 12),
    read: true,
    partnerId: "ptr_mercure",
    siteId: "site_oceane_nantes",
    href: "/sites/site_oceane_nantes",
  },
];

// ---------------------------------------------------------------------------
// AI summaries (pre-generated examples; src/lib/ai.ts generates fresh ones)
// ---------------------------------------------------------------------------

export const aiSummaries: AiSummary[] = [
  {
    id: "ai_seed_stmalo",
    organizationId: ORG_ID,
    scope: "site",
    refId: "site_stmalo_port",
    headline: "Saint-Malo Port: +12% sessions, uptime back to 97%",
    body: "Your Saint-Malo — Port des Bas-Sablons location generated about 12% more charging sessions this month. Uptime recovered to 97% after a brief 4G connectivity issue on one DC unit (technician scheduled). Competitor pricing nearby remains higher than your average price, so you're well positioned on cost. One maintenance incident is still in progress but has no charging impact.",
    bullets: [
      "Sessions: ~1,480/month (+12% vs the trailing average)",
      "Uptime: 97% — one DC unit briefly offline on a modem fault",
      "Pricing: ~€0.42/kWh vs €0.45–0.49 for TotalEnergies, Electra and Allego nearby",
      "Open item: connectivity incident in progress, ETA tomorrow",
    ],
    actions: ["Share this month's summary with the Ville de Saint-Malo team", "Close the connectivity incident once the modem is swapped"],
    generatedAt: isoDaysAgo(1, 6),
    model: "partneros-summarizer-v1",
  },
];
