// Demand signal layer.
//
// In the MVP this returns mock signals (see mock-data.ts). The functions below
// are written as the *seams* where real integrations plug in later:
//   - weather:        OpenWeather / Météo-France
//   - holidays:       date-holidays / Nager.Date
//   - local events:   Ticketmaster / PredictHQ / municipal feeds
//   - traffic:        TomTom / Google Roads / HERE
//   - history:        our own UtilizationData store
//
// The engine only consumes `DemandSignals.demandMultiplier` plus a few flags,
// so providers can be added incrementally without touching the engine.

import type { DemandSignals, Site, WeatherCondition } from "./types";
import { demandSignalsForSite } from "./mock-data";
import { clamp } from "./utils";

const WEATHER_IMPACT: Record<WeatherCondition, number> = {
  clear: -0.05, // good weather slightly reduces charging urgency on weekends
  clouds: 0.0,
  rain: 0.12,
  snow: 0.2,
  storm: 0.18,
};

/** Compose a demand multiplier (~1.0 neutral) from raw signals. */
export function composeDemandMultiplier(input: {
  weatherImpact: number;
  isHoliday: boolean;
  isWeekend: boolean;
  trafficIndex: number; // 0..1
  eventExtraDemand: number; // 0..1 summed across events
}): number {
  let m = 1;
  m += input.weatherImpact;
  if (input.isHoliday) m += 0.15;
  m += (input.trafficIndex - 0.5) * 0.4;
  m += input.eventExtraDemand * 0.6;
  // Weekends are softer for commuter sites — but the per-site curve already
  // accounts for that, so keep the global nudge small.
  if (input.isWeekend) m -= 0.02;
  return clamp(Math.round(m * 100) / 100, 0.5, 1.8);
}

/**
 * Returns demand signals for a site. Mock implementation; replace the body with
 * real provider calls and keep the return shape.
 */
export async function getDemandSignals(site: Site): Promise<DemandSignals | null> {
  if ((process.env.DATA_SOURCE ?? "mock") === "mock") {
    return demandSignalsForSite(site.id);
  }
  // --- live mode (not implemented in MVP) ---
  // const weather = await fetchWeather(site.lat, site.lng);
  // const holiday = await fetchHoliday(site.country, new Date());
  // const events = await fetchLocalEvents(site.lat, site.lng);
  // const traffic = await fetchTrafficIndex(site.lat, site.lng);
  // const now = new Date();
  // const isWeekend = [0, 6].includes(now.getDay());
  // return {
  //   siteId: site.id,
  //   asOf: now.toISOString().slice(0, 10),
  //   weather: { condition: weather.condition, tempC: weather.tempC, impact: WEATHER_IMPACT[weather.condition] },
  //   isHoliday: !!holiday,
  //   holidayName: holiday?.name,
  //   localEvents: events,
  //   trafficIndex: traffic,
  //   isWeekend,
  //   hourOfDay: now.getHours(),
  //   dayOfWeek: (now.getDay() + 6) % 7,
  //   demandMultiplier: composeDemandMultiplier({
  //     weatherImpact: WEATHER_IMPACT[weather.condition],
  //     isHoliday: !!holiday,
  //     isWeekend,
  //     trafficIndex: traffic,
  //     eventExtraDemand: events.reduce((s, e) => s + e.expectedExtraDemand, 0),
  //   }),
  // };
  return demandSignalsForSite(site.id);
}

export { WEATHER_IMPACT };
