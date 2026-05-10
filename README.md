# VoltYield — Revenue Management for EV Charging

Dynamic pricing & revenue management for EV charging operators. VoltYield helps
operators monitor competitor prices around each site, benchmark local pricing,
detect over/under-priced sites, visualize utilization and revenue opportunity,
and generate AI-assisted pricing recommendations — with a path to automated
price changes via roaming/CPO APIs.

> Think hotel / airline yield management, applied to EV charging networks.

This repository is an **MVP**: a working Next.js app backed by a realistic mock
dataset and a deterministic, rule-based recommendation engine. The data layer is
deliberately abstracted so real data sources (OpenChargeMap, Google Places,
roaming APIs, CSV import, Postgres) can replace the mocks with minimal changes.

---

## Quick start

```bash
# Node 18.18+ recommended
npm install
cp .env.example .env        # optional — app runs fine with defaults (DATA_SOURCE=mock)
npm run dev                  # http://localhost:3000  → redirects to /dashboard
```

Other scripts:

```bash
npm run build        # production build
npm run start        # run the production build
npm run typecheck    # tsc --noEmit
npm run lint         # next lint
```

No database, API keys, or external services are required to run the MVP.

---

## What's in the box

### Pages
| Route | Purpose |
| --- | --- |
| `/dashboard` | KPI cards, site map, pricing benchmark table, top AI recommendation, alerts panel |
| `/sites` | Portfolio map + table of all charging sites with key metrics |
| `/sites/[id]` | Site detail: stats, competitor map, hourly/weekday utilization charts, demand signals, competitor benchmark, recommendations, alerts |
| `/competitors` | Competitor benchmarking across the portfolio + full competitor station list |
| `/recommendations` | All engine recommendations with status filters; accept / dismiss / export each |
| `/alerts` | Alert feed (competitor moves, over/under pricing, utilization drops, opportunities, demand windows) |
| `/reports` | Monthly pricing & revenue report (printable, JSON export) |
| `/settings` | Organization, pricing-strategy knobs, team, data-source/integration status |

### API routes (`/api/*`)
| Method & path | Description |
| --- | --- |
| `GET /api/me` | Current user + organization |
| `GET /api/kpis` | Portfolio KPI summary |
| `GET /api/sites` | List sites |
| `GET /api/sites/:id` | Site detail bundle (competitors, benchmark, utilization, demand, recommendations, alerts) |
| `GET /api/competitors?siteId=` | Competitor stations (optionally filtered by site) |
| `GET /api/benchmarks` | Per-site pricing benchmark rows |
| `GET /api/recommendations?siteId=&status=` | Recommendations |
| `PATCH /api/recommendations/:id` | Update status — body `{ "status": "accepted" \| "dismissed" \| "exported" \| "open" }` |
| `GET /api/alerts?siteId=&unreadOnly=` | Alerts |
| `POST /api/alerts` | Mark all alerts read |
| `PATCH /api/alerts/:id` | Mark one alert read |
| `GET /api/reports` / `GET /api/reports/:id` | Monthly reports |
| `GET /api/demand-signals/:siteId` | Demand signals for a site |

### Core libraries (`src/lib/`)
- **`types.ts`** — domain types shared by the data layer, API and UI (mirror the Prisma schema).
- **`mock-data.ts`** — hand-authored, realistic mock dataset (org, users, 6 sites, chargers, 15 competitors, utilization curves, price observations, demand signals).
- **`recommendation-engine.ts`** — pure, deterministic rule engine: benchmarks, recommendations, alerts, KPI rollups, monthly report builder, and an `explainRecommendation()` LLM seam.
- **`demand-signals.ts`** — demand-signal layer with the live-integration seam (weather / holidays / events / traffic) and a composite demand multiplier.
- **`data.ts`** — the single data-access module the app imports; composes mock data + engine and holds interactive demo state (recommendation status, alert read-state).
- **`utils.ts`** — formatting, haversine distance, small helpers.

---

## The recommendation engine

All numbers are computed **deterministically** by the engine — never by an LLM.
An optional LLM step (`explainRecommendation`) only *rephrases* the rule-based
rationale; it cannot change figures. Implemented rules:

1. **Lower price** — our price > 10% above the local competitor average **and**
   utilization is below the low threshold → suggest a reduction toward `local avg × (1 + targetGapAbove)`.
2. **Raise price** — our price > 5% below the local average **and** utilization
   is above the high threshold → suggest an increase that sits just under the local average.
3. **Happy hour** — utilization is well below the daily average in a contiguous
   off-peak band → suggest a time-boxed discount in that window.
4. **Hold / nudge up** — ≥ 50% of nearby competitors are at/near capacity and we
   aren't under-utilized → hold price, or nudge up if there's headroom.
5. **Demand-spike uplift** — composite demand signal (weather, holiday, local
   events, traffic, weekend) ≥ +15% over baseline → temporary uplift, then revert.
6. **7-day promo test** — high competitor gap **and** declining weekday
   utilization → run a short promotional price to de-risk a permanent change.

Impact estimates use a constant-elasticity proxy over the site's current
price/sessions/revenue, with two regimes: an *own-price* elasticity (≈ −0.4)
when the site is at/under market and demand is sticky, and a *competitive*
elasticity (≈ −1.3) when the site is well above market and under-utilized (so a
price cut is revenue-accretive because drivers are substituting to competitors).
Engine knobs live on the organization
(`targetGapAbove`, `lowUtilizationThreshold`, `highUtilizationThreshold`,
`minPriceStep`, `autoApply`) and are surfaced read-only on `/settings`.

Example outputs (generated from the mock data):
- *"Your price (€0.49/kWh) is 17% above the local competitor average (€0.41/kWh) while utilization is only 31%. Lower price by €0.06/kWh…"*
- *"Your site is 9% cheaper than local competitors (€0.61/kWh) while utilization is 78%. Increase price by €0.05/kWh…"*
- *"Competitor gap is high and utilization is trending down. Test €0.03/kWh lower for 7 days…"*

---

## Database

The target schema is in [`prisma/schema.prisma`](prisma/schema.prisma):
`Organization`, `User`, `Site`, `Charger`, `Competitor`, `PriceObservation`,
`UtilizationData`, `Recommendation`, `Alert`, `Report`.

The MVP does **not** require Postgres — it uses the in-memory mock layer. To wire
up the database later:

```bash
# set DATABASE_URL in .env, then:
npm run prisma:generate
npm run prisma:migrate     # creates tables
npm run seed               # loads the mock dataset into Postgres
# then re-implement the bodies of src/lib/data.ts using PrismaClient
```

---

## Switching from mock to live data

`DATA_SOURCE=mock` (default) keeps everything offline. The seams for live data:

- **`src/lib/data.ts`** — the contract every page/route uses. Swap function
  bodies for Prisma queries / provider calls; keep the signatures.
- **`src/lib/demand-signals.ts`** — `getDemandSignals(site)` has a commented
  live branch for weather/holiday/event/traffic providers.
- **`src/lib/recommendation-engine.ts`** — `explainRecommendation()` has a
  commented Anthropic call to rephrase rationales.

Candidate providers (configure via `.env`): OpenChargeMap, Google Maps Places,
Chargeprice, public roaming/CPO APIs, OpenWeather, manual CSV import, and
(where legally allowed) scraped public pricing pages.

See [`docs/NEXT_STEPS.md`](docs/NEXT_STEPS.md) for the integration roadmap.

---

## Tech stack

- **Next.js 14** (App Router) · **React 18** · **TypeScript**
- **Tailwind CSS** (custom B2B theme: royal dark blue `#0B1F4D`, secondary `#1E4ED8`, canvas `#F8FAFC`)
- **Recharts** for charts; a dependency-free schematic map (`src/components/SiteMap.tsx`) — swap for Mapbox/Leaflet when `NEXT_PUBLIC_MAPBOX_TOKEN` is set
- **Prisma** schema for the target Postgres model (not required for the MVP)

---

## Docs

- [`docs/PRD.md`](docs/PRD.md) — product requirements
- [`docs/WIREFRAMES.md`](docs/WIREFRAMES.md) — UX wireframe structure
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — architecture & data flow
- [`docs/NEXT_STEPS.md`](docs/NEXT_STEPS.md) — real-data integration roadmap

---

## Notes & limitations (MVP)

- Auth is stubbed: a single demo user/organization is returned by `getCurrentUser()`/`getOrganization()`. Wire up NextAuth/Clerk before any real use.
- Recommendation status and alert read-state are kept in process memory — they reset on server restart. Persist via the database for production.
- The map is schematic (no basemap tiles) to keep the MVP dependency-light.
- Impact estimates are directional, not forecasts. Treat recommendations as decision support, not autopilot (`autoApply` is disabled).
