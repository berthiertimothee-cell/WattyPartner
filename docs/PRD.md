# VoltYield — Product Requirements Document (MVP)

## 1. Summary

VoltYield is a **revenue management platform for EV charging operators**. It
brings hotel/airline-style yield management to charging networks: continuously
benchmark local competition, detect mispriced sites, quantify revenue
opportunity, and recommend (and eventually automate) pricing actions.

**Positioning:** "Revenue Management for EV Charging."

**MVP goal:** a credible, demoable product in ~4 weeks built on realistic mock
data, with an architecture that lets real data sources replace the mocks without
rework.

## 2. Target users

- **Charge Point Operators (CPOs)** running 5–500 public charging sites.
- **Roles:** owner/exec (portfolio view), pricing analyst (day-to-day actions),
  operations (alerts, utilization), viewer (read-only).

## 3. Problem

Operators set prices statically (cost-plus or "match the big players") and rarely
react to local competition, utilization patterns, or demand spikes. They lack:
- visibility into nearby competitor prices and availability,
- a benchmark of where each site sits vs. its local market,
- a quantified view of revenue left on the table,
- a structured, explainable way to decide and apply price changes.

## 4. Value proposition

- **Benchmark every site** against its local competitor set automatically.
- **Spot mispricing** (overpriced + low utilization, underpriced + saturated).
- **Quantify opportunity** in € / month, per site and portfolio-wide.
- **Recommend actions** with clear rationale and estimated impact; accept,
  dismiss, or export each.
- **React to demand** (weather, holidays, events, traffic) with temporary uplifts.
- **Path to automation** via roaming/CPO pricing APIs (post-MVP).

## 5. MVP scope (in)

### 5.1 Dashboard
- KPI cards: Average price/kWh, Competitor gap, Revenue opportunity,
  Utilization rate, Recommended actions (+ open alerts).
- Map view of charging sites (schematic in MVP).
- Pricing benchmark table (our price vs. local average, gap, position).
- AI recommendation card (highest-impact open action).
- Alerts panel.

### 5.2 Site management
Each site: name, address, lat/lng, max charger power, current price/kWh,
utilization rate, sessions/day, revenue/month, uptime, operator name, chargers
(power, connector types, count), status. List + detail pages.

### 5.3 Competitor benchmarking
Per site: nearby competitor stations with distance, power, price/kWh,
availability (when exposed), operator, and price gap vs. our site. Portfolio-wide
benchmark view. Mock data first; provider-agnostic ingestion design.

### 5.4 Pricing recommendation engine
Rule-based engine (deterministic). Rules: lower price (overpriced + low util),
raise price (underpriced + high util), happy-hour pricing (off-peak troughs),
hold/nudge (competitors saturated), demand-spike uplift (weather/holiday/event/
traffic), 7-day promo test (high gap + declining util). Each recommendation has a
type, severity, rationale, action, suggested price delta, optional window,
estimated impact (sessions %, revenue %, revenue €/mo), and the signals that
fired. Optional LLM step rephrases the rationale only — never computes numbers.

### 5.5 Demand signals
Placeholders/mocks for weather, holidays, local events, traffic, historical
utilization, time of day, day of week — combined into a composite demand
multiplier consumed by the engine.

### 5.6 Alerts
Competitor price change, site overpriced, site underpriced, utilization drop,
revenue opportunity detected, high-demand window detected. Read/unread state.

### 5.7 Reports
Monthly report: pricing performance, benchmark vs. competitors, revenue
opportunity, recommended actions, top underperforming sites, top price-increase
opportunities. Printable; JSON export.

### 5.8 Settings
Organization details, pricing-strategy knobs (engine thresholds), team members,
data-source/integration status.

## 6. Out of scope (MVP)

- Real authentication & multi-tenant onboarding (stubbed single org/user).
- Live data integrations (designed for, not implemented).
- Automated price pushes to CPO/roaming APIs (`autoApply` disabled).
- Billing, RBAC enforcement, audit log UI, notifications (email/Slack).
- Mobile apps.

## 7. Key flows

1. User logs in → sees portfolio dashboard.
2. User opens a site → sees nearby competitors on the map and in a table.
3. Platform shows the price gap and position (over/under/aligned).
4. Engine generates recommendation(s) for the site with estimated impact.
5. User accepts, dismisses, or exports a recommendation.
6. Monthly report rolls up performance and the open opportunity.

## 8. Success metrics (post-MVP)

- % of sites with an up-to-date competitor benchmark.
- # of recommendations accepted / month.
- € realized from accepted recommendations (uplift vs. baseline).
- Reduction in overpriced-low-utilization site-days.
- Time-to-react to a competitor price change.

## 9. Non-functional

- **Trust:** numbers are deterministic and explainable; AI only summarizes.
- **Extensibility:** one data-access module (`src/lib/data.ts`) is the seam.
- **Performance:** dashboard renders < 1s on mock data; provider calls cached.
- **Legal:** only ingest data sources that are licensed or clearly permitted;
  scraping only where allowed.
- **Design:** clean, minimalist B2B SaaS — white background, soft cards, generous
  spacing; accent `#0B1F4D`, secondary `#1E4ED8`.

## 10. Risks

- **Competitor price data quality/coverage** — mitigate with multiple providers,
  CSV import, and explicit "price n/a" handling.
- **Elasticity assumptions** — present impact as directional; support promo tests.
- **Legal exposure of scraping** — gate behind per-source legal review.
- **Operator trust in automation** — keep human-in-the-loop; automation opt-in.
