# PartnerOS — Product Requirements Document

**Product:** PartnerOS by Watty — a Partner Success Platform for EV charging networks (CPOs).
**Status:** MVP (Phase 1–2 implemented; Phase 3 scoped).
**Owner:** Watty Product.

---

## 1. Problem

EV charging operators run their partner relationships out of scattered emails,
Excel files, disconnected CRMs and maintenance ticket queues. The result:

- Partners (retailers, hotels, property owners, fleets, municipalities) don't
  understand how their chargers are performing.
- They don't know the status of a deployment or when an issue will be fixed.
- They don't understand their revenue share / royalties.
- There is no single source of truth, and no transparency.

This erodes trust, slows expansion, and makes every partner review a
spreadsheet-wrangling exercise.

## 2. Vision

The "Stripe Dashboard" / "Airbnb Host Dashboard" for EV charging partnerships:
one clean, premium product where the CPO and the partner see the same numbers,
the same timelines and the same status — explained in plain language.

**Guiding principle:** a partner understands everything in **under 10 seconds**.

## 3. Target customers

- Small & medium EV charging operators (CPOs)
- Retail charging operators
- Hospitality charging networks
- Regional EV operators
- Charging infrastructure managers
- Fleets and real-estate groups (as partners, and increasingly as buyers)

## 4. Goals & non-goals

**Goals**
- Centralise partner communication, site performance, incidents, contracts,
  royalties, deployments, documents, campaigns and reporting.
- Make revenue sharing fully transparent and visually explainable.
- Give partners real-time deployment and incident visibility with ETAs.
- Use AI to summarise, explain and draft — never to compute money.

**Non-goals (for the MVP)**
- Driver-facing app / roaming / e-mobility billing (eMSP) — out of scope.
- Energy trading, smart charging optimisation — out of scope.
- Replacing the CSMS/OCPP backend — PartnerOS sits on top of it.

## 5. Users & roles

| Role | Description | Sees |
| --- | --- | --- |
| `operator_admin` | CPO admin | Everything across the workspace |
| `operator_member` | CPO team member / account manager | Everything; owns assigned partners |
| `partner` | Retailer / hotel / fleet / municipality contact | Their own sites, incidents, revenue, deployments, documents, reports |

The MVP demo is signed in as a CPO admin; partner-scoped views reuse the same
pages filtered by `partnerId`.

## 6. Functional requirements (modules)

### 6.1 Partner Dashboard (`/dashboard`)
Overview: revenue generated, charging sessions, uptime, active chargers,
estimated royalties, current incidents, ongoing works, recent activity, and an
AI-generated site summary (e.g. *"Your Saint-Malo location generated +12% more
sessions this month. Uptime improved to 97%. Competitor pricing remains higher
than your average price. One maintenance incident remains open."*).

### 6.2 Site Management (`/sites`, `/sites/[id]`)
Per site: photos, address, coordinates, charger models, power, status, uptime,
commissioning date, O&M operator, electricity type (grid / green / solar
hybrid), maintenance history, utilization metrics, sessions/day, revenue/month.

### 6.3 Incident & Maintenance Tracking (`/incidents`, `/incidents/[id]`)
Centralised ticketing: incident creation, maintenance status, contractor
assignment, cable-theft tracking, SLA tracking, repair history, ETA visibility,
incident timeline, photo uploads. Statuses: **Open → In Progress → Waiting
External Provider → Scheduled → Resolved**.

### 6.4 Revenue & Royalties (`/revenues`)
Monthly revenue, royalties calculation, electricity costs, invoices,
downloadable reports, payment history, estimated next payout, discrepancy
alerts. Includes a **visual "how the royalty is calculated" explainer** so
non-technical partners understand it instantly: gross charging revenue −
electricity supply cost − platform & ops fee → contractual revenue share.

### 6.5 Deployment & Works Tracking (`/deployments`, `/deployments/[id]`)
Permits, grid connection, civil works, equipment delivery, commissioning,
delays, milestones, expected go-live — with a progress timeline, documents,
photos, comments and ETA.

### 6.6 Competitor Benchmark (inside `/sites/[id]`)
Per site: nearby competitors (Tesla Supercharger, Ionity, Fastned,
TotalEnergies, Electra, Allego, Power Dot, Engie Vianeo…), price comparison,
charger power comparison, utilization benchmark, market positioning, local
market-share estimate.

### 6.7 Marketing Campaigns (`/campaigns`)
Launch promo codes, charging discounts, onboarding / reopening / retailer /
fleet campaigns. Track sessions generated, promo usage, uplift estimation.

### 6.8 AI Partner Assistant (`src/lib/ai.ts`)
Summarises site & partner performance and incidents; explains revenue changes;
drafts partner emails; generates monthly reports; suggests actions. Examples:
*"Utilization is low compared to nearby competitors. Consider a reopening
campaign."* / *"Revenue decreased due to lower uptime during cable
replacement."* / *"This partner has not received communication in 45 days."*

### 6.9 Alerts Center (`/alerts`)
Auto-generated alerts: uptime drops, charger offline, unusual revenue decline,
missing invoice, delayed deployment, unresolved ticket, high-utilization
opportunity, partner inactivity, royalty discrepancy.

### 6.10 Documents & Contracts (`/documents`)
Contracts, amendments, invoices, reports, permits, technical documentation,
signed PDFs — searchable and linked to partners and sites.

### Reports (`/reports`) & Settings (`/settings`)
Generate/share monthly partner reports; manage workspace, team, royalty
defaults, maintenance providers, AI configuration and integrations.

## 7. Non-functional requirements

- **Design:** extremely clean and minimalist; premium B2B SaaS; inspired by
  Airbnb, Stripe and Notion. White cards on `#F8FAFC`, large rounded cards,
  elegant spacing, minimal clutter, very clear hierarchy. Calm, modern,
  trustworthy, enterprise-ready, simple enough for non-technical partners.
- **Brand palette:** primary royal dark blue `#0B1F4D`, secondary blue
  `#1E4ED8`, background `#F8FAFC`, cards `#FFFFFF`, text `#111827`, muted text
  `#6B7280`, success `#16A34A`, warning `#F59E0B`, danger `#DC2626`.
- **Performance:** server-rendered pages, static where possible; first load JS
  ~90 kB shared.
- **Determinism:** all financial figures computed in code; AI output is clearly
  labelled and never used for arithmetic.
- **Privacy/security:** partner users only ever see their own data; role-based
  scoping is enforced in the data layer.

## 8. Success metrics

- Time-to-understanding: a partner can answer "how are my chargers doing / what
  am I getting paid / what's the status of my new site" in < 10 s.
- Reduction in partner-support emails and ad-hoc spreadsheet exports.
- % of partners active in the portal monthly.
- Incident comms latency (time from status change → partner notified).
- Deployment ETA accuracy.

## 9. Release plan

- **Phase 1 (done):** mock data, dashboard, site management, incidents, revenue
  visualization.
- **Phase 2 (done):** deployment tracking, campaigns, AI summaries,
  notifications/alerts, documents, reports.
- **Phase 3 (scoped):** OCPP/CSMS + accounting integrations, predictive
  analytics, automated partner communication, external/public APIs, partner SSO.
