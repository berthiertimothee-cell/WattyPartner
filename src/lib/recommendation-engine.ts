// VoltYield rule-based pricing recommendation engine.
//
// Design principles:
//   1. All numbers are computed deterministically here — never by an LLM.
//   2. Each rule emits a structured Recommendation with the signals that fired,
//      so the UI can show "why" and so an LLM can later *rephrase* (not invent)
//      the rationale via explainRecommendation().
//   3. Pure functions, no I/O — the data layer feeds it inputs.

import {
  Alert,
  AlertType,
  BenchmarkRow,
  Competitor,
  DemandSignals,
  KpiSummary,
  OrgSettings,
  PriceObservation,
  Recommendation,
  Report,
  RecommendationType,
  Severity,
  Site,
  UtilizationData,
} from "./types";
import { clamp, mean, round } from "./utils";

// --- Benchmarking ---------------------------------------------------------

export function buildBenchmark(site: Site, competitors: Competitor[]): BenchmarkRow {
  const priced = competitors.map((c) => c.pricePerKwh).filter((p): p is number => p !== null);
  const competitorAvg = mean(priced);
  const competitorMin = priced.length ? Math.min(...priced) : null;
  const competitorMax = priced.length ? Math.max(...priced) : null;
  const gapAbs = competitorAvg === null ? null : round(site.currentPricePerKwh - competitorAvg, 3);
  const gapPct = competitorAvg === null || competitorAvg === 0 ? null : round((site.currentPricePerKwh - competitorAvg) / competitorAvg, 4);

  let position: BenchmarkRow["position"] = "unknown";
  if (gapPct !== null) {
    if (gapPct > 0.05) position = "overpriced";
    else if (gapPct < -0.05) position = "underpriced";
    else position = "aligned";
  }

  return {
    siteId: site.id,
    siteName: site.name,
    city: site.city,
    ourPrice: site.currentPricePerKwh,
    competitorAvg,
    competitorMin,
    competitorMax,
    competitorCount: competitors.length,
    gapAbs,
    gapPct,
    utilizationRate: site.utilizationRate,
    position,
  };
}

// --- Recommendations ------------------------------------------------------

interface EngineInputs {
  site: Site;
  competitors: Competitor[];
  utilization: UtilizationData | null;
  demand: DemandSignals | null;
  settings: OrgSettings;
}

let recCounter = 0;
function recId(siteId: string, type: string) {
  recCounter += 1;
  return `rec_${siteId}_${type}_${recCounter}`;
}

// Constant-elasticity proxy. Two regimes:
//   - "own-price": when we're at/under market, demand is fairly sticky → ≈ -0.4.
//   - "competitive": when we're well above market and under-utilized, drivers are
//     actively substituting to competitors, so the effective elasticity is much
//     higher → ≈ -1.3. This is what makes a price *cut* revenue-accretive in the
//     overpriced/low-utilization case.
const OWN_PRICE_ELASTICITY = -0.4;
const COMPETITIVE_ELASTICITY = -1.3;

function priceImpactEstimate(
  site: Site,
  priceDelta: number,
  elasticity: number = OWN_PRICE_ELASTICITY,
): { sessionsChangePct: number; revenueChangePct: number; revenueChangePerMonth: number } {
  const pricePctChange = priceDelta / site.currentPricePerKwh;
  const sessionsChangePct = round(elasticity * pricePctChange, 4);
  const revenuePctChange = round((1 + pricePctChange) * (1 + sessionsChangePct) - 1, 4);
  return {
    sessionsChangePct,
    revenueChangePct: revenuePctChange,
    revenueChangePerMonth: round(site.revenuePerMonth * revenuePctChange, 0),
  };
}

function happyHourWindow(utilization: UtilizationData | null): { window: string; lowHours: number[] } | null {
  if (!utilization) return null;
  const avg = mean(utilization.hourly.map((h) => h.utilization)) ?? 0;
  const low = utilization.hourly.filter((h) => h.utilization < avg * 0.6 && h.hour >= 9 && h.hour <= 23);
  if (low.length < 2) return null;
  const hours = low.map((h) => h.hour).sort((a, b) => a - b);
  // collapse to a contiguous-ish band
  const start = hours[0];
  const end = hours[hours.length - 1] + 1;
  return { window: `${String(start).padStart(2, "0")}:00–${String(end).padStart(2, "0")}:00`, lowHours: hours };
}

export function generateRecommendations(input: EngineInputs): Recommendation[] {
  const { site, competitors, utilization, demand, settings } = input;
  const bench = buildBenchmark(site, competitors);
  const out: Recommendation[] = [];
  const now = new Date().toISOString();
  const cur = site.currency;

  const lowUtil = site.utilizationRate < settings.lowUtilizationThreshold;
  const highUtil = site.utilizationRate >= settings.highUtilizationThreshold;
  const sym = cur === "EUR" ? "€" : cur === "GBP" ? "£" : "$";

  // Rule 1 — overpriced + low utilization => lower price
  if (bench.gapPct !== null && bench.gapPct > 0.10 && lowUtil) {
    const target = bench.competitorAvg! * (1 + settings.targetGapAbove);
    let delta = round(target - site.currentPricePerKwh, 2); // negative
    if (delta > -settings.minPriceStep) delta = -settings.minPriceStep;
    const impact = priceImpactEstimate(site, delta, COMPETITIVE_ELASTICITY);
    out.push({
      id: recId(site.id, "lower"),
      siteId: site.id,
      type: "lower_price",
      severity: "warning",
      title: "Lower price to recover utilization",
      rationale: `Your price (${sym}${site.currentPricePerKwh.toFixed(2)}/kWh) is ${(bench.gapPct * 100).toFixed(0)}% above the local competitor average (${sym}${bench.competitorAvg!.toFixed(2)}/kWh) while utilization is only ${(site.utilizationRate * 100).toFixed(0)}%.`,
      action: `Lower price by ${sym}${Math.abs(delta).toFixed(2)}/kWh to ${sym}${(site.currentPricePerKwh + delta).toFixed(2)}/kWh.`,
      suggestedPriceDelta: delta,
      estimatedImpact: impact,
      signals: { gapPct: bench.gapPct, utilizationRate: site.utilizationRate, competitorAvg: bench.competitorAvg!, ourPrice: site.currentPricePerKwh },
      status: "open",
      createdAt: now,
    });
  }

  // Rule 2 — underpriced + high utilization => raise price
  if (bench.gapPct !== null && bench.gapPct < -0.05 && highUtil) {
    const target = bench.competitorAvg! * (1 - 0.02); // sit just under the local average
    let delta = round(Math.min(target - site.currentPricePerKwh, bench.competitorAvg! * 0.08), 2); // positive, capped
    if (delta < settings.minPriceStep) delta = settings.minPriceStep;
    const impact = priceImpactEstimate(site, delta);
    out.push({
      id: recId(site.id, "raise"),
      siteId: site.id,
      type: "raise_price",
      severity: "opportunity",
      title: "Raise price — you're leaving margin on the table",
      rationale: `Your site is ${(Math.abs(bench.gapPct) * 100).toFixed(0)}% cheaper than local competitors (${sym}${bench.competitorAvg!.toFixed(2)}/kWh) while utilization is ${(site.utilizationRate * 100).toFixed(0)}%.`,
      action: `Increase price by ${sym}${delta.toFixed(2)}/kWh to ${sym}${(site.currentPricePerKwh + delta).toFixed(2)}/kWh.`,
      suggestedPriceDelta: delta,
      estimatedImpact: impact,
      signals: { gapPct: bench.gapPct, utilizationRate: site.utilizationRate, competitorAvg: bench.competitorAvg!, ourPrice: site.currentPricePerKwh },
      status: "open",
      createdAt: now,
    });
  }

  // Rule 3 — low utilization in specific hours => happy hour pricing
  const hh = happyHourWindow(utilization);
  if (hh && lowUtil) {
    const delta = -Math.max(settings.minPriceStep * 3, round(site.currentPricePerKwh * 0.06, 2));
    const impact = priceImpactEstimate(site, delta, COMPETITIVE_ELASTICITY);
    // Off-peak share of revenue is modest, so scale the monthly figure down.
    const offPeakRevShare = 0.25;
    out.push({
      id: recId(site.id, "happyhour"),
      siteId: site.id,
      type: "happy_hour",
      severity: "opportunity",
      title: "Introduce off-peak (happy hour) pricing",
      rationale: `Utilization is well below the daily average between ${hh.window}. A targeted discount can shift flexible sessions into that window without eroding peak revenue.`,
      action: `Discount ${sym}${Math.abs(delta).toFixed(2)}/kWh between ${hh.window} to lift estimated sessions by ~${Math.abs(impact.sessionsChangePct * 100).toFixed(0)}% in that window.`,
      suggestedPriceDelta: delta,
      window: hh.window,
      estimatedImpact: {
        sessionsChangePct: Math.abs(impact.sessionsChangePct),
        revenueChangePct: round(impact.revenueChangePct * offPeakRevShare, 4),
        revenueChangePerMonth: round(site.revenuePerMonth * impact.revenueChangePct * offPeakRevShare, 0),
      },
      signals: { window: hh.window, utilizationRate: site.utilizationRate },
      status: "open",
      createdAt: now,
    });
  }

  // Rule 4 — nearby competitors unavailable/saturated => hold or nudge up
  const pricedCompetitors = competitors.filter((c) => c.availability !== null);
  const saturated = pricedCompetitors.filter((c) => (c.availability ?? 1) <= 0.15);
  if (pricedCompetitors.length > 0 && saturated.length / pricedCompetitors.length >= 0.5 && !lowUtil) {
    const canNudge = bench.gapPct === null || bench.gapPct < 0.08;
    const delta = canNudge ? settings.minPriceStep : 0;
    const impact = delta ? priceImpactEstimate(site, delta) : { sessionsChangePct: 0, revenueChangePct: 0, revenueChangePerMonth: 0 };
    out.push({
      id: recId(site.id, "hold"),
      siteId: site.id,
      type: delta ? "raise_price" : "hold_price",
      severity: "info",
      title: delta ? "Competitors saturated — nudge price up" : "Competitors saturated — hold price",
      rationale: `${saturated.length} of ${pricedCompetitors.length} nearby stations are at or near capacity. Demand spilling over is likely to land at your site.`,
      action: delta ? `Increase price by ${sym}${delta.toFixed(2)}/kWh while the local market stays tight.` : `Hold current price; revisit if competitor availability recovers.`,
      suggestedPriceDelta: delta || null,
      estimatedImpact: impact,
      signals: { saturatedCompetitors: saturated.length, totalCompetitors: pricedCompetitors.length, utilizationRate: site.utilizationRate },
      status: "open",
      createdAt: now,
    });
  }

  // Rule 5 — strong demand signals (weather/holiday/event/traffic) => temporary adjustment
  if (demand && demand.demandMultiplier >= 1.15 && !lowUtil) {
    const reasons: string[] = [];
    if (demand.weather.impact >= 0.1) reasons.push(`${demand.weather.condition} weather`);
    if (demand.isHoliday) reasons.push(demand.holidayName ?? "a public holiday");
    if (demand.localEvents.length) reasons.push(demand.localEvents.map((e) => e.name).join(", "));
    if (demand.trafficIndex >= 0.75) reasons.push("elevated local traffic");
    if (demand.isWeekend) reasons.push("weekend travel");
    const delta = round(site.currentPricePerKwh * 0.04, 2);
    const impact = priceImpactEstimate(site, delta);
    out.push({
      id: recId(site.id, "demandspike"),
      siteId: site.id,
      type: "promo_test",
      severity: "opportunity",
      title: "Temporary uplift for an expected demand spike",
      rationale: `Demand signals point to a near-term spike (${reasons.join("; ") || "elevated composite demand"}), with a ~${Math.round((demand.demandMultiplier - 1) * 100)}% lift over baseline.`,
      action: `Apply a temporary +${sym}${delta.toFixed(2)}/kWh uplift for the high-demand window, then revert. Monitor utilization for price resistance.`,
      suggestedPriceDelta: delta,
      window: "next 24–72h",
      estimatedImpact: impact,
      signals: { demandMultiplier: demand.demandMultiplier, weather: demand.weather.condition, isHoliday: demand.isHoliday, trafficIndex: demand.trafficIndex },
      status: "open",
      createdAt: now,
    });
  }

  // Rule 6 — declining utilization (weekday trend) + high gap => 7-day promo test
  if (utilization && bench.gapPct !== null && bench.gapPct > 0.08) {
    const wd = utilization.weekday;
    const declining = wd.length >= 5 && wd[4] < wd[0] * 0.95; // Friday below Monday — placeholder trend check
    if (declining && !out.some((r) => r.type === "lower_price")) {
      const delta = -Math.max(settings.minPriceStep * 2, round(site.currentPricePerKwh * 0.05, 2));
      const impact = priceImpactEstimate(site, delta, COMPETITIVE_ELASTICITY);
      out.push({
        id: recId(site.id, "promo"),
        siteId: site.id,
        type: "promo_test",
        severity: "warning",
        title: "Run a 7-day promotional price",
        rationale: `Competitor gap is high (${(bench.gapPct * 100).toFixed(0)}%) and utilization is trending down. A short promo de-risks a permanent price change.`,
        action: `Test ${sym}${Math.abs(delta).toFixed(2)}/kWh lower for 7 days; keep it if sessions rise ≥${Math.abs(Math.round(impact.sessionsChangePct * 100)) + 4}%.`,
        suggestedPriceDelta: delta,
        window: "7-day test",
        estimatedImpact: { sessionsChangePct: Math.abs(impact.sessionsChangePct), revenueChangePct: impact.revenueChangePct, revenueChangePerMonth: impact.revenueChangePerMonth },
        signals: { gapPct: bench.gapPct, weekdayTrend: round(wd[4] - wd[0], 3) },
        status: "open",
        createdAt: now,
      });
    }
  }

  return out;
}

// --- Alerts ---------------------------------------------------------------

let alertCounter = 0;
function alertId(siteId: string, type: string) {
  alertCounter += 1;
  return `alert_${siteId}_${type}_${alertCounter}`;
}

export function generateAlerts(input: {
  site: Site;
  competitors: Competitor[];
  utilization: UtilizationData | null;
  priceObservations: PriceObservation[];
  demand: DemandSignals | null;
  settings: OrgSettings;
  recommendations: Recommendation[];
}): Alert[] {
  const { site, competitors, utilization, priceObservations, demand, settings, recommendations } = input;
  const bench = buildBenchmark(site, competitors);
  const out: Alert[] = [];
  const now = new Date().toISOString();
  const sym = site.currency === "EUR" ? "€" : site.currency === "GBP" ? "£" : "$";

  // Competitor price change — compare last two observations per competitor.
  const byCompetitor = new Map<string, PriceObservation[]>();
  for (const o of priceObservations) {
    if (!o.competitorId) continue;
    const arr = byCompetitor.get(o.competitorId) ?? [];
    arr.push(o);
    byCompetitor.set(o.competitorId, arr);
  }
  for (const [cid, obs] of byCompetitor) {
    if (obs.length < 2) continue;
    const sorted = [...obs].sort((a, b) => +new Date(a.observedAt) - +new Date(b.observedAt));
    const prev = sorted[sorted.length - 2];
    const last = sorted[sorted.length - 1];
    if (Math.abs(last.pricePerKwh - prev.pricePerKwh) >= 0.02) {
      const comp = competitors.find((c) => c.id === cid);
      const dir = last.pricePerKwh > prev.pricePerKwh ? "increased" : "cut";
      out.push({
        id: alertId(site.id, "competitor_price_change"),
        siteId: site.id,
        type: "competitor_price_change",
        severity: dir === "cut" ? "warning" : "info",
        title: `${comp?.name ?? "A competitor"} ${dir} price`,
        message: `${comp?.name ?? "Competitor"} (${comp?.operatorName ?? "?"}) ${dir} price from ${sym}${prev.pricePerKwh.toFixed(2)} to ${sym}${last.pricePerKwh.toFixed(2)}/kWh near ${site.name}.`,
        data: { competitorId: cid, oldPrice: prev.pricePerKwh, newPrice: last.pricePerKwh },
        read: false,
        createdAt: last.observedAt,
      });
    }
  }

  // Overpriced / underpriced
  if (bench.position === "overpriced") {
    out.push({
      id: alertId(site.id, "site_overpriced"),
      siteId: site.id,
      type: "site_overpriced",
      severity: site.utilizationRate < settings.lowUtilizationThreshold ? "critical" : "warning",
      title: `${site.name} is overpriced vs local market`,
      message: `Priced ${(bench.gapPct! * 100).toFixed(0)}% above the local average (${sym}${bench.competitorAvg!.toFixed(2)}/kWh). Utilization is ${(site.utilizationRate * 100).toFixed(0)}%.`,
      data: { gapPct: bench.gapPct!, competitorAvg: bench.competitorAvg!, ourPrice: site.currentPricePerKwh },
      read: false,
      createdAt: now,
    });
  } else if (bench.position === "underpriced" && site.utilizationRate >= settings.highUtilizationThreshold) {
    out.push({
      id: alertId(site.id, "site_underpriced"),
      siteId: site.id,
      type: "site_underpriced",
      severity: "opportunity",
      title: `${site.name} is underpriced at high utilization`,
      message: `Priced ${(Math.abs(bench.gapPct!) * 100).toFixed(0)}% below the local average while running at ${(site.utilizationRate * 100).toFixed(0)}% utilization.`,
      data: { gapPct: bench.gapPct!, competitorAvg: bench.competitorAvg!, ourPrice: site.currentPricePerKwh },
      read: false,
      createdAt: now,
    });
  }

  // Utilization drop (weekday curve heuristic)
  if (utilization) {
    const wd = utilization.weekday;
    if (wd.length >= 5 && wd[4] < wd[0] * 0.9) {
      out.push({
        id: alertId(site.id, "utilization_drop"),
        siteId: site.id,
        type: "utilization_drop",
        severity: "warning",
        title: `Utilization trending down at ${site.name}`,
        message: `Weekday utilization fell from ${(wd[0] * 100).toFixed(0)}% to ${(wd[4] * 100).toFixed(0)}% across the week.`,
        data: { from: wd[0], to: wd[4] },
        read: false,
        createdAt: now,
      });
    }
  }

  // Revenue opportunity (driven by recommendations with positive monthly impact)
  const upside = recommendations
    .map((r) => r.estimatedImpact.revenueChangePerMonth ?? 0)
    .filter((v) => v > 0)
    .reduce((a, b) => a + b, 0);
  if (upside >= 300) {
    out.push({
      id: alertId(site.id, "revenue_opportunity"),
      siteId: site.id,
      type: "revenue_opportunity",
      severity: "opportunity",
      title: `~${sym}${Math.round(upside).toLocaleString("en-US")}/mo opportunity at ${site.name}`,
      message: `Open recommendations for this site add up to roughly ${sym}${Math.round(upside).toLocaleString("en-US")} in additional monthly revenue if applied.`,
      data: { revenueOpportunity: Math.round(upside) },
      read: false,
      createdAt: now,
    });
  }

  // High-demand window
  if (demand && demand.demandMultiplier >= 1.2) {
    out.push({
      id: alertId(site.id, "high_demand_window"),
      siteId: site.id,
      type: "high_demand_window",
      severity: "opportunity",
      title: `High-demand window expected near ${site.name}`,
      message: `Composite demand is ~${Math.round((demand.demandMultiplier - 1) * 100)}% above baseline${demand.localEvents.length ? ` (${demand.localEvents.map((e) => e.name).join(", ")})` : ""}.`,
      data: { demandMultiplier: demand.demandMultiplier },
      read: false,
      createdAt: now,
    });
  }

  return out;
}

// --- LLM explanation (optional) ------------------------------------------

/**
 * Returns a human-friendly rationale for a recommendation. If an LLM provider is
 * configured (ANTHROPIC_API_KEY) this would call it to *rephrase* the rule-based
 * rationale + signals — never to compute numbers. In the MVP it returns the
 * deterministic rationale unchanged so the product works offline.
 */
export async function explainRecommendation(rec: Recommendation): Promise<string> {
  // To wire this up later:
  //   const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  //   const msg = await client.messages.create({ model: process.env.LLM_MODEL, max_tokens: 200,
  //     system: "Rephrase the given EV-charging pricing recommendation for an operator. " +
  //             "Do not change any numbers. Be concise and concrete.",
  //     messages: [{ role: "user", content: JSON.stringify({ rationale: rec.rationale, action: rec.action, signals: rec.signals }) }] });
  //   return msg.content[0].type === "text" ? msg.content[0].text : rec.rationale;
  return `${rec.rationale} ${rec.action}`;
}

// --- Portfolio KPIs -------------------------------------------------------

export function summarizeKpis(args: {
  sites: Site[];
  benchmarks: BenchmarkRow[];
  recommendations: Recommendation[];
  openAlerts: number;
}): KpiSummary {
  const { sites, benchmarks, recommendations, openAlerts } = args;
  const totalRevenue = sites.reduce((s, x) => s + x.revenuePerMonth, 0) || 1;

  // Revenue-weighted average price.
  const avgPrice = sites.reduce((s, x) => s + x.currentPricePerKwh * x.revenuePerMonth, 0) / totalRevenue;
  // Revenue-weighted utilization.
  const utilization = sites.reduce((s, x) => s + x.utilizationRate * x.revenuePerMonth, 0) / totalRevenue;
  // Revenue-weighted competitor gap (only sites with a benchmark).
  const benched = benchmarks.filter((b) => b.gapPct !== null);
  const benchRevenue = benched.reduce((s, b) => {
    const site = sites.find((x) => x.id === b.siteId);
    return s + (site?.revenuePerMonth ?? 0);
  }, 0) || 1;
  const competitorGapPct = benched.reduce((s, b) => {
    const site = sites.find((x) => x.id === b.siteId);
    return s + (b.gapPct ?? 0) * (site?.revenuePerMonth ?? 0);
  }, 0) / benchRevenue;

  const revenueOpportunity = recommendations
    .map((r) => r.estimatedImpact.revenueChangePerMonth ?? 0)
    .filter((v) => v > 0)
    .reduce((a, b) => a + b, 0);

  return {
    avgPricePerKwh: round(avgPrice, 3),
    currency: sites[0]?.currency ?? "EUR",
    competitorGapPct: round(competitorGapPct, 4),
    revenueOpportunity: Math.round(revenueOpportunity),
    utilizationRate: round(utilization, 3),
    recommendedActions: recommendations.filter((r) => r.status === "open").length,
    openAlerts,
    siteCount: sites.length,
  };
}

// --- Monthly report -------------------------------------------------------

export function buildReport(args: {
  organizationId: string;
  periodStart: string;
  periodLabel: string;
  sites: Site[];
  benchmarks: BenchmarkRow[];
  recommendations: Recommendation[];
}): Report {
  const { organizationId, periodStart, periodLabel, sites, benchmarks, recommendations } = args;
  const avgPricePerKwh = round(mean(sites.map((s) => s.currentPricePerKwh)) ?? 0, 3);
  const competitorAvgPricePerKwh = round(
    mean(benchmarks.map((b) => b.competitorAvg).filter((v): v is number => v !== null)) ?? 0,
    3,
  );
  const avgUtilization = round(mean(sites.map((s) => s.utilizationRate)) ?? 0, 3);
  const totalRevenue = Math.round(sites.reduce((s, x) => s + x.revenuePerMonth, 0));
  const revenueOpportunity = Math.round(
    recommendations.map((r) => r.estimatedImpact.revenueChangePerMonth ?? 0).filter((v) => v > 0).reduce((a, b) => a + b, 0),
  );

  const topUnderperformingSites = [...sites]
    .sort((a, b) => a.utilizationRate - b.utilizationRate)
    .slice(0, 3)
    .map((s) => ({
      siteId: s.id,
      siteName: s.name,
      utilization: s.utilizationRate,
      note: s.utilizationRate < 0.35 ? "Below target utilization — pricing review recommended." : "Monitor; utilization near lower bound.",
    }));

  const topPriceIncreaseOpportunities = recommendations
    .filter((r) => r.type === "raise_price" && (r.suggestedPriceDelta ?? 0) > 0)
    .sort((a, b) => (b.estimatedImpact.revenueChangePerMonth ?? 0) - (a.estimatedImpact.revenueChangePerMonth ?? 0))
    .slice(0, 3)
    .map((r) => {
      const site = sites.find((s) => s.id === r.siteId);
      return {
        siteId: r.siteId,
        siteName: site?.name ?? r.siteId,
        suggestedDelta: r.suggestedPriceDelta ?? 0,
        note: r.action,
      };
    });

  const gapPct = competitorAvgPricePerKwh ? round((avgPricePerKwh - competitorAvgPricePerKwh) / competitorAvgPricePerKwh, 4) : 0;

  return {
    id: `report_${organizationId}_${periodStart}`,
    organizationId,
    periodStart,
    periodLabel,
    generatedAt: new Date().toISOString(),
    summary: {
      avgPricePerKwh,
      competitorAvgPricePerKwh,
      avgUtilization,
      totalRevenue,
      revenueOpportunity,
      recommendedActions: recommendations.filter((r) => r.status === "open").length,
      topUnderperformingSites,
      topPriceIncreaseOpportunities,
      pricingPerformanceNote:
        gapPct > 0.03
          ? `Portfolio is priced ~${(gapPct * 100).toFixed(0)}% above local competitor averages. Review overpriced, low-utilization sites first.`
          : gapPct < -0.03
            ? `Portfolio is priced ~${(Math.abs(gapPct) * 100).toFixed(0)}% below local competitor averages — likely margin upside at high-utilization sites.`
            : `Portfolio pricing is broadly aligned with local competitor averages.`,
      benchmarkNote: `Across ${benchmarks.length} benchmarked sites, ${benchmarks.filter((b) => b.position === "overpriced").length} are overpriced, ${benchmarks.filter((b) => b.position === "underpriced").length} underpriced, ${benchmarks.filter((b) => b.position === "aligned").length} aligned.`,
    },
  };
}

export const _internal = { priceImpactEstimate, happyHourWindow };
export type { RecommendationType, Severity };
