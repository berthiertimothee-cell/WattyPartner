# VoltYield — Next Steps: Real Data Integration & Roadmap

The MVP runs entirely on mock data behind a single seam (`src/lib/data.ts`).
This document is the plan to replace mocks with real data and harden the product.

## Phase 0 — Foundations (precondition for everything below)

- **Database:** provision Postgres, set `DATABASE_URL`, `prisma migrate dev`,
  `npm run seed`. Re-implement `src/lib/data.ts` functions with `PrismaClient`
  (keep signatures). Move recommendation-status and alert-read state into tables.
- **Auth & tenancy:** add NextAuth (or Clerk). Scope every query by
  `organizationId`. Replace `getCurrentUser()`/`getOrganization()` stubs.
- **Config:** add `DATA_SOURCE=live` handling; feature-flag each provider.

## Phase 1 — Competitor data (highest product value)

Goal: every site has an up-to-date, real competitor set with prices & availability.

1. **OpenChargeMap** — primary source for nearby station locations, operator,
   power, connector types. Query by lat/lng + radius around each site. Map POIs →
   `Competitor` rows; set `source = openchargemap`, `lastSeenAt = now`.
   - Env: `OPENCHARGEMAP_API_KEY`.
2. **Google Maps Places** — fill gaps OCM misses; geocode addresses; validate
   coordinates. `source = google_places`. Mind ToS (no bulk caching beyond
   allowed limits).
3. **Chargeprice** — tariff / price-per-kWh enrichment for known operators.
   Populate `Competitor.pricePerKwh` and append a `PriceObservation`.
   - Env: `CHARGEPRICE_API_KEY`.
4. **Public roaming / CPO APIs** — where partnerships exist (e.g. Hubject,
   Gireve, operator APIs), pull live `availability` and authoritative tariffs.
   `source = roaming_api`.
5. **CSV import** — UI to upload sites / competitors / price lists; `source =
   csv_import`. Useful for operators with private knowledge or pilot data.
6. **Scraping (last resort, gated)** — only public pricing pages, only where
   legally reviewed and permitted; rate-limited; clearly labeled `source =
   manual`/scraped with timestamps. Never block product on this.

**Scheduling:** background jobs (BullMQ/Celery or Vercel Cron) — discovery
weekly, prices/availability every 1–6h. Write `PriceObservation` rows each poll
so the competitor-price-change alert and trend logic work on real history.

**Data quality:** dedupe stations across providers (geo + name fuzzy match);
keep `price = null` honest; track per-source freshness; surface staleness in UI.

## Phase 2 — First-party telemetry (utilization, sessions, revenue, uptime)

- Ingest the operator's CDRs / session logs (OCPP backend export, CSV, or API).
- Build `UtilizationData` (hourly curve + weekday averages) from real sessions;
  compute `sessionsPerDay`, `revenuePerMonth`, `uptime` from telemetry.
- Replace the synthesized curves in `mock-data.ts`. Keep a backfill window
  (≥ 30–90 days) so trend rules (declining utilization) are meaningful.

## Phase 3 — Demand signals (real providers)

Implement the `live` branch in `src/lib/demand-signals.ts`:
- **Weather:** OpenWeather / Météo-France — current + short forecast per site
  (`OPENWEATHER_API_KEY`).
- **Holidays:** `date-holidays` / Nager.Date by country/region.
- **Local events:** PredictHQ / Ticketmaster / municipal open-data feeds within a
  radius; weight by attendance.
- **Traffic:** TomTom / HERE traffic index near the site; or derive from historical
  session timing.
- Keep `composeDemandMultiplier` as the single combiner; tune weights against
  observed lift.

## Phase 4 — Recommendation engine v2

- **Calibrate elasticity per site** from observed price changes & promo tests
  (replace the global ≈ −0.4 proxy). Store per-site elasticity; show confidence.
- **Time-of-day pricing optimization** beyond the single happy-hour band
  (piecewise tariffs maximizing expected revenue subject to operator constraints).
- **Backtesting harness:** replay history, score what the engine *would* have
  recommended vs. realized outcomes.
- **A/B & promo-test tracking:** first-class entity for tests with start/end,
  control vs. treatment, and automatic verdict.
- **LLM rationale layer:** wire `explainRecommendation()` to Anthropic
  (`ANTHROPIC_API_KEY`, `LLM_MODEL`) to rephrase rationales for operators and
  draft report narratives — strictly no numeric authorship; validate that
  figures in the output match the structured recommendation.

## Phase 5 — Automation (pricing actuation)

- Integrations to push approved prices to CPO backends / roaming hubs.
- Guardrails: min/max bounds, max change per day, approval workflow, kill switch,
  full audit log. `Organization.autoApply` gate stays opt-in; start with
  "auto-draft, human approves," then "auto-apply within bounds."

## Phase 6 — Platform hardening

- RBAC enforcement per role; SSO; org onboarding wizard.
- Notifications: email/Slack/webhook for alerts and accepted recommendations.
- Audit log UI; data-source health dashboard; rate-limit & cost monitoring.
- Reporting: scheduled monthly PDF email; CSV/Excel exports; multi-month trends.
- Observability: structured logs, tracing, error tracking; SLOs on data freshness.
- Compliance: per-source legal sign-off; data-retention policy; PII review (CDRs).
- Testing: unit tests for the engine (golden cases), API contract tests, E2E
  (Playwright) for the core flows.

## Suggested 4-week MVP-to-pilot sequencing

| Week | Focus |
| --- | --- |
| 1 | Postgres + Prisma wiring, auth stub → real auth, deploy pipeline |
| 2 | OpenChargeMap + Google Places ingestion, competitor dedupe, price polling job |
| 3 | First-party telemetry import → real utilization/revenue; demand: weather + holidays |
| 4 | Engine calibration on pilot data, promo-test tracking, monthly report polish, pilot onboarding |
