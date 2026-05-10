# PartnerOS — by Watty

**The Partner Success Platform for EV charging networks.**

PartnerOS is the "Stripe Dashboard" / "Airbnb Host Dashboard" for EV charging
partnerships. It gives Charge Point Operators (CPOs) — and their retail, hotel,
real-estate, fleet and municipal partners — one calm, transparent place to see
**site performance, incidents, revenue & royalties, deployments, campaigns,
documents and AI-generated summaries**.

> Core product philosophy: **a partner should understand everything in under 10 seconds.**

This repository contains the **MVP** — a Next.js app with a realistic French
demo dataset, a clean B2B SaaS UI, a deterministic AI assistant layer, a REST
API and a Prisma schema for going live. It is built like a real seed-stage
startup product.

---

## What's inside

| Module | Where |
| --- | --- |
| 1. Partner Dashboard — revenue, sessions, uptime, chargers, royalties, incidents, works, activity, AI site summary | `/dashboard` |
| 2. Site Management — photos, address, coordinates, charger models, power, status, uptime, commissioning, operator, electricity type, maintenance history, utilization, sessions/day, revenue/month | `/sites`, `/sites/[id]` |
| 3. Incident & Maintenance Tracking — creation, statuses, contractor assignment, cable-theft tracking, SLA, repair history, ETA, timeline, photos | `/incidents`, `/incidents/[id]` |
| 4. Revenue & Royalties — monthly revenue, royalty calculation, electricity costs, invoices, downloadable reports, payment history, next-payout estimate, discrepancy alerts, **visual explainer** | `/revenues` |
| 5. Deployment & Works Tracking — permits, grid connection, civil works, equipment delivery, commissioning, delays, milestones, expected go-live, progress timeline, documents | `/deployments`, `/deployments/[id]` |
| 6. Competitor Benchmark — nearby competitors, price comparison, power comparison, utilization benchmark, market positioning, local market-share estimate | inside `/sites/[id]` |
| 7. Marketing Campaigns — promo codes, charging discounts, onboarding / reopening / retailer / fleet campaigns, sessions generated, promo usage, uplift estimation | `/campaigns` |
| 8. AI Partner Assistant — summarises sites/partners/incidents/reports/deployments, explains revenue changes, drafts partner emails, suggests actions | `src/lib/ai.ts`, surfaced across the app |
| 9. Alerts Center — uptime drops, charger offline, revenue decline, missing invoice, deployment delay, unresolved ticket, utilization opportunity, partner inactivity, discrepancies | `/alerts` |
| 10. Documents & Contracts — contracts, amendments, invoices, reports, permits, technical docs, signed PDFs | `/documents` |
| Reports | `/reports` |
| Settings — workspace, team, royalty defaults, maintenance providers, AI config, integrations | `/settings` |

Other pages: `/partners`, `/partners/[id]`.

---

## Tech stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Recharts. Clean inline SVG icon set; no heavyweight UI kit. (Mapbox slot wired via `NEXT_PUBLIC_MAPBOX_TOKEN`; site detail pages render schematic placeholders without it.)
- **Backend:** Next.js Route Handlers expose a small REST API (`/api/*`). The shape is identical whether data comes from the in-memory demo or Postgres.
- **Data layer:** `src/lib/data.ts` is the single seam — in the MVP it composes the static demo dataset (`src/lib/mock-data.ts`) and derives KPIs, alerts and AI summaries. Swap the function bodies for Prisma queries to go live.
- **Database (target):** PostgreSQL via Prisma — full schema in [`prisma/schema.prisma`](prisma/schema.prisma) covering Organizations, Users, Partners, Sites, Chargers, SiteMonthlyMetrics, Incidents, IncidentEvents, MaintenanceProviders, RevenueReports, RoyaltyLines, Deployments, DeploymentMilestones, SiteBenchmark, CompetitorPoint, Campaigns, Documents, Contracts, Notifications, AiSummaries.
- **AI layer:** OpenAI / Claude API. Used **only** for summaries, explanations, recommendations and communication drafting — **never** for deterministic calculations. The MVP ships a deterministic template engine in `src/lib/ai.ts` that mirrors the production prompt contract, so the app is fully functional offline and the swap to a real model is a single function body.

---

## Getting started

```bash
npm install
cp .env.example .env       # mock mode works with no keys
npm run dev                # http://localhost:3000  → redirects to /dashboard
```

Useful scripts:

```bash
npm run build       # production build
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
```

### Going live with a database (optional)

```bash
# 1. point DATABASE_URL at Postgres in .env  (see .env.example)
npm run prisma:generate
npm run prisma:migrate      # creates the schema
npm run seed                # loads the demo dataset via Prisma
```

Then replace the bodies of the functions in `src/lib/data.ts` with Prisma
queries — the API routes and pages don't change.

### Plugging in a real AI model

Set `ANTHROPIC_API_KEY` (and `AI_MODEL=claude-sonnet-4-6`) or `OPENAI_API_KEY`,
then replace the template bodies in `src/lib/ai.ts` with a model call. Feed the
model the **already-computed** metrics from `src/lib/data.ts` and ask only for
prose / drafts. Keep `AI_MODEL_ID` updated so it shows on the AI summary cards.

---

## Demo data

Hand-authored, realistic data for a mid-size French CPO ("Watty"):

- **6 partners** — Carrefour Bretagne (retail), Hôtels Océane Ouest (hospitality), Foncière Atlantique (real estate), Greenfleet Logistics (fleet), Ville de Saint-Malo (municipality), Decathlon Sud-Ouest (retail, onboarding).
- **12 sites** across Bretagne, Pays de la Loire, Nouvelle-Aquitaine, Auvergne-Rhône-Alpes and Occitanie — including active HPC hubs, hospitality AC sites, a site in maintenance after a cable theft, and two in deployment.
- **Chargers** from ABB, Alpitronic and Schneider; trailing monthly metric series (sessions, energy, revenue, uptime, price) generated from compact seeds.
- **8 incidents** spanning power-module faults, cable theft, connectivity, payment terminals and scheduled firmware — with full timelines and SLA/ETA tracking.
- **Revenue reports** for the last three months per partner, with a flagged discrepancy and a service credit.
- **4 deployments** with milestone timelines (one delayed by an Enedis grid-connection slot), **6 campaigns**, **16 documents**, **7 contracts**, **10 alerts**.

All financial figures are computed deterministically; the AI layer only narrates.

---

## Documentation

- [`docs/PRD.md`](docs/PRD.md) — Product Requirements Document
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — UX architecture, user flows, data & API architecture, AI assistant logic
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deployment instructions (Vercel / Docker / GCP-AWS) and the database cutover
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — phased MVP → seed plan

---

## Project structure

```
src/
  app/
    layout.tsx, page.tsx, not-found.tsx, globals.css
    dashboard/  partners/  sites/  incidents/  deployments/
    revenues/   campaigns/  documents/  reports/  alerts/  settings/
    api/        # REST route handlers
  components/
    ui.tsx, Icons.tsx, StatusBadge.tsx, Charts.tsx (client),
    AiSummaryCard.tsx, AlertsList.tsx, ActivityFeed.tsx, Timeline.tsx
    layout/     # Sidebar (client), Topbar, Logo
  lib/
    types.ts        # domain types (mirror the Prisma schema)
    mock-data.ts     # the demo dataset
    data.ts          # data access layer — the swap-to-Postgres seam
    ai.ts            # AI Partner Assistant logic (deterministic templates)
    utils.ts         # formatting & math helpers
prisma/
  schema.prisma, seed.ts
```

---

Built by Watty. Calm, modern, trustworthy, enterprise-ready — and simple enough
for a shop manager or property owner to understand at a glance.
