// Static mock dataset for VoltYield MVP.
// Sites, chargers, competitors and utilization curves are hand-authored to be
// realistic. Recommendations, alerts, benchmarks and KPIs are *derived* from
// this data by the recommendation engine (see recommendation-engine.ts) so the
// product behaves consistently end-to-end.
//
// When DATA_SOURCE=live, the data layer (lib/data.ts) should fetch the same
// shapes from Postgres / external providers instead of importing this module.

import type {
  Charger,
  Competitor,
  DemandSignals,
  Organization,
  PriceObservation,
  Site,
  User,
  UtilizationData,
  UtilizationPoint,
} from "./types";

export const ORGANIZATION: Organization = {
  id: "org_1",
  name: "Voltente Mobility",
  country: "FR",
  currency: "EUR",
  settings: {
    targetGapAbove: 0.05,
    lowUtilizationThreshold: 0.35,
    highUtilizationThreshold: 0.65,
    minPriceStep: 0.01,
    autoApply: false,
  },
  createdAt: "2025-11-01T09:00:00.000Z",
};

export const USERS: User[] = [
  {
    id: "user_1",
    organizationId: ORGANIZATION.id,
    email: "alex@voltente.example",
    name: "Alex Marchand",
    role: "owner",
    createdAt: "2025-11-01T09:00:00.000Z",
  },
  {
    id: "user_2",
    organizationId: ORGANIZATION.id,
    email: "priya@voltente.example",
    name: "Priya Nair",
    role: "analyst",
    createdAt: "2025-11-12T09:00:00.000Z",
  },
];

export const CURRENT_USER = USERS[0];

// --- Helpers to synthesize plausible utilization curves -------------------

function hourlyCurve(peakHours: number[], base: number, peak: number, sessionsPerDay: number): UtilizationPoint[] {
  const points: UtilizationPoint[] = [];
  let weights: number[] = [];
  for (let h = 0; h < 24; h++) {
    const nearPeak = Math.min(...peakHours.map((p) => Math.abs(h - p)));
    const w = Math.max(0, 1 - nearPeak / 5);
    const u = base + (peak - base) * w;
    weights.push(u);
    points.push({ hour: h, utilization: Math.round(u * 100) / 100, sessions: 0 });
  }
  const wSum = weights.reduce((a, b) => a + b, 0);
  for (let h = 0; h < 24; h++) {
    points[h].sessions = Math.round((weights[h] / wSum) * sessionsPerDay * 10) / 10;
  }
  return points;
}

// --- Chargers -------------------------------------------------------------

const CHARGERS: Record<string, Charger[]> = {
  site_1: [
    { id: "chg_1a", siteId: "site_1", label: "Pylon A", powerKw: 150, connectorTypes: ["CCS", "CHAdeMO"], count: 4 },
    { id: "chg_1b", siteId: "site_1", label: "Pylon B", powerKw: 50, connectorTypes: ["CCS", "Type2"], count: 2 },
  ],
  site_2: [
    { id: "chg_2a", siteId: "site_2", label: "Hub", powerKw: 300, connectorTypes: ["CCS"], count: 6 },
  ],
  site_3: [
    { id: "chg_3a", siteId: "site_3", label: "Mall Deck", powerKw: 50, connectorTypes: ["CCS", "Type2"], count: 8 },
  ],
  site_4: [
    { id: "chg_4a", siteId: "site_4", label: "Highway Stack", powerKw: 350, connectorTypes: ["CCS"], count: 8 },
  ],
  site_5: [
    { id: "chg_5a", siteId: "site_5", label: "Depot AC", powerKw: 22, connectorTypes: ["Type2"], count: 12 },
    { id: "chg_5b", siteId: "site_5", label: "Depot DC", powerKw: 120, connectorTypes: ["CCS"], count: 2 },
  ],
  site_6: [
    { id: "chg_6a", siteId: "site_6", label: "Plaza DC", powerKw: 180, connectorTypes: ["CCS", "CHAdeMO"], count: 4 },
  ],
};

export function chargersForSite(siteId: string): Charger[] {
  return CHARGERS[siteId] ?? [];
}

// --- Sites ----------------------------------------------------------------

export const SITES: Site[] = [
  {
    id: "site_1",
    organizationId: ORGANIZATION.id,
    name: "Lyon Confluence",
    address: "112 Cours Charlemagne",
    city: "Lyon",
    country: "FR",
    lat: 45.7406,
    lng: 4.8157,
    operatorName: "Voltente",
    maxPowerKw: 150,
    currentPricePerKwh: 0.49,
    currency: "EUR",
    utilizationRate: 0.31,
    sessionsPerDay: 38,
    revenuePerMonth: 18250,
    uptime: 0.985,
    chargers: chargersForSite("site_1"),
    status: "active",
    createdAt: "2025-11-05T09:00:00.000Z",
  },
  {
    id: "site_2",
    organizationId: ORGANIZATION.id,
    name: "Paris La Défense Hub",
    address: "4 Place de la Défense",
    city: "Courbevoie",
    country: "FR",
    lat: 48.8918,
    lng: 2.2389,
    operatorName: "Voltente",
    maxPowerKw: 300,
    currentPricePerKwh: 0.55,
    currency: "EUR",
    utilizationRate: 0.78,
    sessionsPerDay: 142,
    revenuePerMonth: 96400,
    uptime: 0.992,
    chargers: chargersForSite("site_2"),
    status: "active",
    createdAt: "2025-11-05T09:00:00.000Z",
  },
  {
    id: "site_3",
    organizationId: ORGANIZATION.id,
    name: "Bordeaux Lac Mall",
    address: "Rue du Professeur Georges Jeanneney",
    city: "Bordeaux",
    country: "FR",
    lat: 44.8807,
    lng: -0.5664,
    operatorName: "Voltente",
    maxPowerKw: 50,
    currentPricePerKwh: 0.42,
    currency: "EUR",
    utilizationRate: 0.27,
    sessionsPerDay: 24,
    revenuePerMonth: 7200,
    uptime: 0.961,
    chargers: chargersForSite("site_3"),
    status: "active",
    createdAt: "2025-11-08T09:00:00.000Z",
  },
  {
    id: "site_4",
    organizationId: ORGANIZATION.id,
    name: "A7 Montélimar Aire",
    address: "Aire de Montélimar Est, A7",
    city: "Montélimar",
    country: "FR",
    lat: 44.5800,
    lng: 4.7900,
    operatorName: "Voltente",
    maxPowerKw: 350,
    currentPricePerKwh: 0.59,
    currency: "EUR",
    utilizationRate: 0.69,
    sessionsPerDay: 118,
    revenuePerMonth: 71300,
    uptime: 0.978,
    chargers: chargersForSite("site_4"),
    status: "active",
    createdAt: "2025-11-10T09:00:00.000Z",
  },
  {
    id: "site_5",
    organizationId: ORGANIZATION.id,
    name: "Nantes Fleet Depot",
    address: "Boulevard de Seattle",
    city: "Nantes",
    country: "FR",
    lat: 47.2380,
    lng: -1.5290,
    operatorName: "Voltente",
    maxPowerKw: 120,
    currentPricePerKwh: 0.34,
    currency: "EUR",
    utilizationRate: 0.58,
    sessionsPerDay: 64,
    revenuePerMonth: 14800,
    uptime: 0.994,
    chargers: chargersForSite("site_5"),
    status: "active",
    createdAt: "2025-11-15T09:00:00.000Z",
  },
  {
    id: "site_6",
    organizationId: ORGANIZATION.id,
    name: "Lille Euralille Plaza",
    address: "Avenue Willy Brandt",
    city: "Lille",
    country: "FR",
    lat: 50.6370,
    lng: 3.0760,
    operatorName: "Voltente",
    maxPowerKw: 180,
    currentPricePerKwh: 0.46,
    currency: "EUR",
    utilizationRate: 0.44,
    sessionsPerDay: 52,
    revenuePerMonth: 24100,
    uptime: 0.969,
    chargers: chargersForSite("site_6"),
    status: "active",
    createdAt: "2025-11-18T09:00:00.000Z",
  },
];

// --- Competitors (discovered near each site) ------------------------------

export const COMPETITORS: Competitor[] = [
  // Lyon Confluence — our €0.49 is well above local avg ~€0.41, low util => lower price
  { id: "cmp_1", siteId: "site_1", name: "Ionity Lyon Sud", operatorName: "Ionity", lat: 45.735, lng: 4.812, distanceKm: 0.8, maxPowerKw: 350, pricePerKwh: 0.39, currency: "EUR", availability: 0.7, source: "mock", lastSeenAt: "2026-05-09T07:30:00.000Z" },
  { id: "cmp_2", siteId: "site_1", name: "TotalEnergies Confluence", operatorName: "TotalEnergies", lat: 45.742, lng: 4.820, distanceKm: 0.6, maxPowerKw: 175, pricePerKwh: 0.44, currency: "EUR", availability: 0.5, source: "mock", lastSeenAt: "2026-05-09T08:10:00.000Z" },
  { id: "cmp_3", siteId: "site_1", name: "Tesla Supercharger Gerland", operatorName: "Tesla", lat: 45.726, lng: 4.832, distanceKm: 1.9, maxPowerKw: 250, pricePerKwh: 0.40, currency: "EUR", availability: 0.6, source: "mock", lastSeenAt: "2026-05-09T06:50:00.000Z" },

  // Paris La Défense — our €0.55 below local avg ~€0.61, high util => raise price
  { id: "cmp_4", siteId: "site_2", name: "Ionity La Défense", operatorName: "Ionity", lat: 48.890, lng: 2.241, distanceKm: 0.4, maxPowerKw: 350, pricePerKwh: 0.62, currency: "EUR", availability: 0.2, source: "mock", lastSeenAt: "2026-05-09T08:40:00.000Z" },
  { id: "cmp_5", siteId: "site_2", name: "Allego Courbevoie", operatorName: "Allego", lat: 48.896, lng: 2.246, distanceKm: 0.7, maxPowerKw: 175, pricePerKwh: 0.59, currency: "EUR", availability: 0.3, source: "mock", lastSeenAt: "2026-05-09T07:20:00.000Z" },
  { id: "cmp_6", siteId: "site_2", name: "Fastned Puteaux", operatorName: "Fastned", lat: 48.884, lng: 2.236, distanceKm: 1.2, maxPowerKw: 300, pricePerKwh: 0.63, currency: "EUR", availability: 0.4, source: "mock", lastSeenAt: "2026-05-09T08:00:00.000Z" },

  // Bordeaux Lac Mall — our €0.42 vs avg ~€0.41, but very low util => happy hour
  { id: "cmp_7", siteId: "site_3", name: "Lidl Bordeaux Lac", operatorName: "Lidl", lat: 44.884, lng: -0.560, distanceKm: 0.9, maxPowerKw: 50, pricePerKwh: 0.39, currency: "EUR", availability: 0.8, source: "mock", lastSeenAt: "2026-05-09T07:00:00.000Z" },
  { id: "cmp_8", siteId: "site_3", name: "Izivia Le Lac", operatorName: "Izivia", lat: 44.876, lng: -0.572, distanceKm: 1.1, maxPowerKw: 50, pricePerKwh: 0.43, currency: "EUR", availability: 0.6, source: "mock", lastSeenAt: "2026-05-09T06:30:00.000Z" },

  // A7 Montélimar — our €0.59 vs avg ~€0.60; nearby competitor saturated => hold
  { id: "cmp_9", siteId: "site_4", name: "Ionity Montélimar", operatorName: "Ionity", lat: 44.585, lng: 4.793, distanceKm: 1.5, maxPowerKw: 350, pricePerKwh: 0.61, currency: "EUR", availability: 0.05, source: "mock", lastSeenAt: "2026-05-09T09:00:00.000Z" },
  { id: "cmp_10", siteId: "site_4", name: "TotalEnergies Aire de l'Aigle", operatorName: "TotalEnergies", lat: 44.560, lng: 4.770, distanceKm: 3.2, maxPowerKw: 175, pricePerKwh: 0.58, currency: "EUR", availability: 0.1, source: "mock", lastSeenAt: "2026-05-09T08:45:00.000Z" },

  // Nantes Fleet Depot — depot pricing, few public competitors, prices unknown
  { id: "cmp_11", siteId: "site_5", name: "Modulo Nantes Est", operatorName: "Modulo", lat: 47.240, lng: -1.520, distanceKm: 1.0, maxPowerKw: 50, pricePerKwh: null, currency: "EUR", availability: null, source: "mock", lastSeenAt: "2026-05-08T19:00:00.000Z" },
  { id: "cmp_12", siteId: "site_5", name: "Lidl Nantes Doulon", operatorName: "Lidl", lat: 47.232, lng: -1.512, distanceKm: 2.3, maxPowerKw: 22, pricePerKwh: 0.30, currency: "EUR", availability: 0.7, source: "mock", lastSeenAt: "2026-05-08T18:30:00.000Z" },

  // Lille Euralille — our €0.46 vs avg ~€0.45, mid util => mild opportunity
  { id: "cmp_13", siteId: "site_6", name: "Fastned Lille", operatorName: "Fastned", lat: 50.640, lng: 3.080, distanceKm: 0.7, maxPowerKw: 300, pricePerKwh: 0.48, currency: "EUR", availability: 0.4, source: "mock", lastSeenAt: "2026-05-09T07:50:00.000Z" },
  { id: "cmp_14", siteId: "site_6", name: "Izivia Euralille", operatorName: "Izivia", lat: 50.634, lng: 3.072, distanceKm: 0.5, maxPowerKw: 50, pricePerKwh: 0.42, currency: "EUR", availability: 0.6, source: "mock", lastSeenAt: "2026-05-09T06:40:00.000Z" },
  { id: "cmp_15", siteId: "site_6", name: "Tesla Supercharger Lille", operatorName: "Tesla", lat: 50.628, lng: 3.090, distanceKm: 1.6, maxPowerKw: 250, pricePerKwh: 0.45, currency: "EUR", availability: 0.5, source: "mock", lastSeenAt: "2026-05-09T07:10:00.000Z" },
];

export function competitorsForSite(siteId: string): Competitor[] {
  return COMPETITORS.filter((c) => c.siteId === siteId);
}

// --- Utilization series ---------------------------------------------------

const UTILIZATION: Record<string, UtilizationData> = {
  site_1: { siteId: "site_1", asOf: "2026-05-09", hourly: hourlyCurve([9, 13, 17], 0.12, 0.46, 38), weekday: [0.30, 0.33, 0.31, 0.34, 0.40, 0.28, 0.20] },
  site_2: { siteId: "site_2", asOf: "2026-05-09", hourly: hourlyCurve([8, 12, 18], 0.40, 0.95, 142), weekday: [0.82, 0.84, 0.83, 0.85, 0.88, 0.62, 0.55] },
  site_3: { siteId: "site_3", asOf: "2026-05-09", hourly: hourlyCurve([11, 15, 19], 0.10, 0.40, 24), weekday: [0.22, 0.24, 0.23, 0.26, 0.32, 0.35, 0.30] },
  site_4: { siteId: "site_4", asOf: "2026-05-09", hourly: hourlyCurve([10, 13, 16], 0.30, 0.92, 118), weekday: [0.58, 0.60, 0.59, 0.66, 0.78, 0.85, 0.80] },
  site_5: { siteId: "site_5", asOf: "2026-05-09", hourly: hourlyCurve([6, 12, 22], 0.30, 0.80, 64), weekday: [0.66, 0.68, 0.67, 0.69, 0.62, 0.30, 0.22] },
  site_6: { siteId: "site_6", asOf: "2026-05-09", hourly: hourlyCurve([9, 13, 18], 0.18, 0.62, 52), weekday: [0.46, 0.48, 0.47, 0.49, 0.52, 0.36, 0.30] },
};

export function utilizationForSite(siteId: string): UtilizationData | null {
  return UTILIZATION[siteId] ?? null;
}

// --- Price observation history (last few snapshots) -----------------------

export const PRICE_OBSERVATIONS: PriceObservation[] = [
  // Ionity Lyon Sud dropped €0.43 -> €0.39 yesterday — triggers a competitor alert
  { id: "obs_1", competitorId: "cmp_1", siteId: "site_1", pricePerKwh: 0.43, currency: "EUR", observedAt: "2026-05-02T07:00:00.000Z", source: "mock" },
  { id: "obs_2", competitorId: "cmp_1", siteId: "site_1", pricePerKwh: 0.39, currency: "EUR", observedAt: "2026-05-09T07:30:00.000Z", source: "mock" },
  { id: "obs_3", competitorId: "cmp_4", siteId: "site_2", pricePerKwh: 0.60, currency: "EUR", observedAt: "2026-05-02T07:00:00.000Z", source: "mock" },
  { id: "obs_4", competitorId: "cmp_4", siteId: "site_2", pricePerKwh: 0.62, currency: "EUR", observedAt: "2026-05-09T08:40:00.000Z", source: "mock" },
  { id: "obs_5", competitorId: "cmp_13", siteId: "site_6", pricePerKwh: 0.45, currency: "EUR", observedAt: "2026-05-02T07:00:00.000Z", source: "mock" },
  { id: "obs_6", competitorId: "cmp_13", siteId: "site_6", pricePerKwh: 0.48, currency: "EUR", observedAt: "2026-05-09T07:50:00.000Z", source: "mock" },
];

export function priceObservationsForSite(siteId: string): PriceObservation[] {
  return PRICE_OBSERVATIONS.filter((o) => o.siteId === siteId);
}

// --- Demand signals (mock; in live mode comes from demand-signals.ts) -----

export const DEMAND_SIGNALS: Record<string, DemandSignals> = {
  site_1: { siteId: "site_1", asOf: "2026-05-10", weather: { condition: "clouds", tempC: 14, impact: 0.0 }, isHoliday: false, localEvents: [], trafficIndex: 0.55, isWeekend: true, hourOfDay: 11, dayOfWeek: 5, demandMultiplier: 0.96 },
  site_2: { siteId: "site_2", asOf: "2026-05-10", weather: { condition: "rain", tempC: 11, impact: 0.15 }, isHoliday: false, localEvents: [{ name: "Paris Tech Summit", date: "2026-05-12", expectedExtraDemand: 0.2 }], trafficIndex: 0.8, isWeekend: true, hourOfDay: 11, dayOfWeek: 5, demandMultiplier: 1.18 },
  site_3: { siteId: "site_3", asOf: "2026-05-10", weather: { condition: "clear", tempC: 19, impact: -0.05 }, isHoliday: false, localEvents: [], trafficIndex: 0.45, isWeekend: true, hourOfDay: 11, dayOfWeek: 5, demandMultiplier: 0.9 },
  site_4: { siteId: "site_4", asOf: "2026-05-10", weather: { condition: "clear", tempC: 21, impact: 0.1 }, isHoliday: true, holidayName: "Ascension long weekend", localEvents: [], trafficIndex: 0.92, isWeekend: true, hourOfDay: 11, dayOfWeek: 5, demandMultiplier: 1.35 },
  site_5: { siteId: "site_5", asOf: "2026-05-10", weather: { condition: "clouds", tempC: 13, impact: 0.0 }, isHoliday: false, localEvents: [], trafficIndex: 0.3, isWeekend: true, hourOfDay: 11, dayOfWeek: 5, demandMultiplier: 0.7 },
  site_6: { siteId: "site_6", asOf: "2026-05-10", weather: { condition: "rain", tempC: 10, impact: 0.12 }, isHoliday: false, localEvents: [{ name: "LOSC home match", date: "2026-05-10", expectedExtraDemand: 0.25 }], trafficIndex: 0.6, isWeekend: true, hourOfDay: 11, dayOfWeek: 5, demandMultiplier: 1.22 },
};

export function demandSignalsForSite(siteId: string): DemandSignals | null {
  return DEMAND_SIGNALS[siteId] ?? null;
}
