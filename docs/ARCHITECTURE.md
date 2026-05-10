# PartnerOS — Architecture

UX architecture, user flows, data model, API and AI assistant logic.

---

## 1. UX architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Sidebar (sticky)                Topbar (sticky: search · alerts · me) │
│  ── Overview                                                       │
│     Dashboard · Alerts Center                                      │
│  ── Network                                                        │
│     Partners · Sites · Incidents · Deployments                     │
│  ── Business                                                       │
│     Revenue & Royalties · Campaigns · Reports · Documents          │
│  ── Settings                                                       │
└──────────────────────────────────────────────────────────────────┘
```

Page anatomy (consistent across the app):
- **PageHeader** — title, one-line subtitle, optional breadcrumb, primary action.
- **KPI tiles row** — 4 large rounded cards with value + MoM delta + sub-line.
- **Two-column body** — main content (2/3) + side rail (1/3) with the AI summary
  card, related lists and detail panels.
- **Cards** — white, `rounded-2xl`, soft shadow; header with icon + title + subtitle.
- **Status as colour** — green = healthy/active/paid, blue = in progress/issued,
  amber = needs attention/maintenance/scheduled, red = critical/faulted, violet
  = scheduled milestone.

Key UX principles: white background, large rounded cards, elegant spacing, very
clear hierarchy, AI summary near the top of every entity page, "explain it
visually" for anything financial.

## 2. User flows

**Operator — Monday morning triage**
Dashboard → see "Sites needing attention" + Alerts → open a critical incident →
read AI incident summary + timeline → "Update partner" (drafted email) → done.

**Operator — monthly close**
Revenues → review royalty statements + discrepancy alerts → open the flagged
partner → AI report summary explains the dip + service credit → Reports →
generate & send the monthly partner report.

**Operator — new site**
Deployments → open the delayed Decathlon Blagnac project → milestone timeline
shows the Enedis grid-connection slippage + re-baselined go-live → AI deployment
summary suggests "send the partner a re-baselined timeline with the reason" →
update partner.

**Partner (portal view, same pages scoped by `partnerId`)**
Dashboard → revenue, sessions, uptime for *their* sites + AI site summary →
Sites → drill into one site → see uptime trend, competitor benchmark,
maintenance history → Revenues → the visual royalty explainer → Documents →
download the latest contract & report.

## 3. Application architecture

- **Next.js 14 App Router.** Pages are React Server Components that call the
  data layer directly (no client data-fetching needed for the demo). The only
  Client Components are the chart wrappers (`src/components/Charts.tsx`, Recharts)
  and the sidebar (active-link highlighting) — they receive only serialisable
  props.
- **Single data seam: `src/lib/data.ts`.** Every page and API route imports
  from here. In the MVP it reads the in-memory dataset (`src/lib/mock-data.ts`)
  and *derives* KPIs, network aggregates, alerts and AI summaries. To go live,
  replace each function body with a Prisma query — signatures and return shapes
  stay the same.
- **REST API: `src/app/api/*`.** Thin route handlers over the data layer:
  - `GET /api/me`
  - `GET /api/dashboard`
  - `GET /api/partners`, `GET /api/partners/[id]`
  - `GET /api/sites?partnerId=&status=`, `GET /api/sites/[id]`, `GET /api/sites/[id]/summary`
  - `GET /api/incidents?siteId=&partnerId=&status=&openOnly=`, `GET /api/incidents/[id]`
  - `GET /api/deployments?partnerId=`, `GET /api/deployments/[id]`
  - `GET /api/revenues?partnerId=&summary=true`
  - `GET /api/campaigns?partnerId=`
  - `GET /api/documents?partnerId=&siteId=&kind=`
  - `GET /api/alerts?unreadOnly=&partnerId=&severity=`
  Responses are `{ "data": ... }` or `{ "error": ... }`. Write endpoints
  (create incident, issue statement, launch campaign, upload document) follow
  the same pattern once a database is wired in.
- **Auth (production):** session cookie → `User` with `organizationId` and, for
  partners, `partnerId`. The data layer filters everything by org and (for
  partner sessions) by partner. The MVP hard-codes `CURRENT_USER_ID`.

## 4. Data model

Domain types in `src/lib/types.ts` mirror the Prisma schema in
`prisma/schema.prisma`:

```
Organization 1───* User
Organization 1───* Partner ──┐
Partner      1───* Site      │  (Partner.accountManager → User)
Site         1───* Charger
Site         1───* SiteMonthlyMetric   (month, sessions, energyKwh, revenueEur, uptimePct, avgPriceEurKwh)
Site         1───1 SiteBenchmark 1───* CompetitorPoint
Site         1───* Incident 1───* IncidentEvent     (Incident.maintenanceProvider → MaintenanceProvider)
Partner      1───* RevenueReport 1───* RoyaltyLine  (RevenueReport *──* Site via RevenueReportSite)
Partner      1───* Deployment 1───* DeploymentMilestone   (Deployment 1───1 Site)
Partner      1───* Campaign *──* Site (CampaignSite)
Partner      1───* Contract           (links a DocumentItem)
Org/Partner/Site/Deployment 1───* DocumentItem
Organization 1───* Notification       (optionally → Partner, Site)
Organization 1───* AiSummary          (scope + refId → site|partner|incident|monthly_report|deployment)
```

Derived (not stored): network aggregates, partner metrics, trend deltas, the
alert feed and the recent-activity feed are computed in `src/lib/data.ts`.

## 5. AI assistant logic (`src/lib/ai.ts`)

**Contract:** the AI layer receives *already-computed* metrics and returns
prose, bullet points, suggested actions and drafted emails. It never does
arithmetic. Every AI output carries a model id and a "generated at" timestamp
and is rendered in a clearly-labelled card with the note *"AI is used only for
summaries, explanations and drafting. All figures are computed
deterministically."*

Functions:
- `summariseSite(site, benchmark, openIncidents)` — the dashboard/site summary
  (sessions delta, uptime, competitor pricing position, open incidents) + next
  steps.
- `summarisePartner(partner, sites, openIncidents, lastContactDays, latestReport)`
  — portfolio view, royalty status, inactivity flag.
- `summariseIncident(incident, siteName, providerName)` — status, category,
  ETA/SLA, vandalism note, next steps (e.g. "send a status update with the ETA").
- `summariseReport(report, partner, sitesById)` — explains the royalty
  build-up and any flagged discrepancy.
- `summariseDeployment(deployment)` — progress, current/blocked milestone,
  delay reason, re-baselined go-live.
- `draftPartnerEmail(kind, ctx)` — `monthly_update | incident_update |
  deployment_update | check_in` → `{ subject, body }`.

**Going live:** swap each template body for a single call to Claude/OpenAI with
a system prompt like *"You write concise, plain-language updates for non-technical
EV-charging partners. Use ONLY the figures provided. Never compute. Output a
headline, 1–2 short paragraphs, 3–5 bullets and 1–3 next steps."* and pass the
metrics object as the user message. Keep `AI_MODEL_ID` in sync so it shows on
the card.

## 6. Frontend conventions

- Tailwind with a small set of component classes in `globals.css` (`.card`,
  `.btn-*`, `.badge`, `.pill`, `.nav-link`, `.input`) and brand colours in
  `tailwind.config.ts`.
- One inline-SVG icon set (`src/components/Icons.tsx`) — no icon dependency.
- Charts: thin Recharts wrappers (`AreaTrendChart`, `LineTrendChart`,
  `BarSeriesChart`, `HBarCompareChart`, `Sparkline`) that take a serialisable
  `format` key, not a formatter function (so they work as Client Components).
- Status badges centralised in `src/components/StatusBadge.tsx`.
- "Photos" are gradient placeholders (`PhotoPlaceholder`) until real imagery /
  Mapbox tiles are connected.
