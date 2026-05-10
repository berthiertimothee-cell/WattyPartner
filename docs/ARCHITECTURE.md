# VoltYield — Architecture

## Overview

```
                    ┌──────────────────────────────────────────────┐
                    │                Next.js (App Router)          │
                    │                                              │
  Browser ───────►  │  Server Components (pages)  ──┐               │
                    │                               ├─► src/lib/data.ts  ◄── single data-access seam
  fetch() ───────►  │  Route handlers (/api/*)  ────┘        │       │
                    │                                        │       │
                    │  Client Components (charts, cards,      │       │
                    │   map, recommendation/alert actions)    │       │
                    └────────────────────────────────────────┼───────┘
                                                              │
                          ┌───────────────────────────────────┴───────────────┐
                          │                                                   │
                  MVP (DATA_SOURCE=mock)                          LIVE (future, DATA_SOURCE=live)
                  ─────────────────────                          ─────────────────────────────
                  src/lib/mock-data.ts          ──►  PrismaClient → PostgreSQL
                  src/lib/recommendation-engine.ts   external providers:
                  src/lib/demand-signals.ts            • OpenChargeMap (competitor stations)
                  (in-memory state for demo)            • Google Maps Places (discovery/geocoding)
                                                       • Chargeprice (tariffs)
                                                       • roaming/CPO APIs (availability, push)
                                                       • OpenWeather (weather)
                                                       • CSV import / manual
                                                     background jobs (price polling, signal refresh)
                                                     optional LLM (Anthropic) → rationale rewrite only
```

## Layers

### 1. Presentation — `src/app/**`, `src/components/**`
- **Server Components** render pages and call `src/lib/data.ts` directly (async).
- **Client Components** (`"use client"`): `charts.tsx` (Recharts), `SiteMap.tsx`
  (dependency-free schematic map), `RecommendationCard.tsx`, `AlertsPanel.tsx`,
  `Sidebar.tsx`, `ReportActions.tsx`. They mutate state via the `/api/*` routes
  and call `router.refresh()` to re-pull server data.
- Styling: Tailwind with a custom theme (`tailwind.config.ts`) — brand
  `#0B1F4D`, secondary `#1E4ED8`, canvas `#F8FAFC`, ink `#111827`, muted
  `#6B7280`, success/warning/danger.

### 2. API — `src/app/api/**`
Thin REST handlers over the data layer. `dynamic = "force-dynamic"` so the demo
reflects in-memory state changes. Mutations: `PATCH /api/recommendations/:id`
(status), `PATCH /api/alerts/:id` (read), `POST /api/alerts` (read all).

### 3. Data access — `src/lib/data.ts`  ← **the seam**
The only module pages/routes import for data. In the MVP it:
- imports the static mock dataset (`mock-data.ts`),
- runs the engine (`recommendation-engine.ts`) to derive benchmarks,
  recommendations, alerts, KPIs, and reports (memoized),
- keeps interactive demo state (recommendation status overrides, alert
  read-state) in module memory.

To go live: re-implement each exported function with Prisma queries / provider
calls. **Signatures and return types are the contract** — nothing upstream
changes.

### 4. Domain logic — `src/lib/recommendation-engine.ts`
Pure functions, no I/O:
- `buildBenchmark(site, competitors)` → `BenchmarkRow`
- `generateRecommendations({site, competitors, utilization, demand, settings})` → `Recommendation[]`
- `generateAlerts({...})` → `Alert[]`
- `summarizeKpis({...})` → `KpiSummary`
- `buildReport({...})` → `Report`
- `explainRecommendation(rec)` → `string` (LLM seam; returns deterministic text in MVP)

All figures are deterministic. Impact uses a two-regime constant-elasticity
proxy (own-price ≈ −0.4 when at/under market; competitive ≈ −1.3 when overpriced
and under-utilized).

### 5. Demand signals — `src/lib/demand-signals.ts`
`getDemandSignals(site)` returns mock signals in MVP; a commented `live` branch
shows where weather/holiday/event/traffic providers plug in. `composeDemandMultiplier`
combines raw signals into a multiplier (~1.0 neutral) the engine consumes.

### 6. Persistence — `prisma/schema.prisma` (+ `prisma/seed.ts`)
Target Postgres model: `Organization`, `User`, `Site`, `Charger`, `Competitor`,
`PriceObservation`, `UtilizationData`, `Recommendation`, `Alert`, `Report`. Not
required for the MVP. `seed.ts` mirrors the mock dataset into the DB.

## Data flow examples

**Dashboard load:** `DashboardPage` (server) → `getKpis()`, `getSites()`,
`getBenchmarks()`, `getRecommendations({status:"open"})`, `getAlerts()` →
`data.ts` `compute()` runs the engine once (memoized) → render KPI cards, map,
benchmark table, top recommendation card, alerts panel.

**Accept a recommendation:** `RecommendationCard` (client) → `PATCH
/api/recommendations/:id {status:"accepted"}` → `setRecommendationStatus()`
records an override → `router.refresh()` → server re-renders with the new status
and updated KPIs (open-action count, revenue opportunity).

**Site detail:** `getSiteDetail(id)` bundles site, competitors, benchmark,
utilization series, demand signals, price observations, and the site's
recommendations/alerts in one call.

## Conventions

- Types live in `src/lib/types.ts` and mirror the Prisma schema names.
- Money is stored/handled in major currency units (e.g. EUR), formatted via
  `src/lib/utils.ts` helpers.
- IDs are stable strings in mock data (`site_1`, `cmp_3`, …); Prisma uses `cuid()`.
- `DATA_SOURCE` env var selects mock vs. live behavior in the data/signal layers.

## Deployment

Standard Next.js. `npm run build && npm run start`, or deploy to Vercel /
container. No env vars are required for the MVP; set `DATABASE_URL` and provider
keys when enabling live data. See `.env.example`.
