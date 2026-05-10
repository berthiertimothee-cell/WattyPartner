# PartnerOS — Roadmap

Built like a seed-stage product: ship a beautiful, useful core fast, then
deepen integrations and intelligence.

## Phase 1 — Foundation ✅ (in this repo)
- Realistic French demo dataset (partners, sites, chargers, metrics).
- Partner Dashboard with KPIs, network charts, AI site summary.
- Site Management (list + detail: photos, specs, uptime, utilization, history).
- Incident & Maintenance Tracking (statuses, SLA/ETA, timeline, providers).
- Revenue & Royalties visualization with the visual royalty explainer.
- Clean B2B SaaS UI (Watty palette), REST API, Prisma schema.

## Phase 2 — Partner experience ✅ (in this repo)
- Deployment & Works tracking (milestone timelines, delays, documents).
- Marketing Campaigns (promo codes, discounts, onboarding/reopening/fleet).
- AI Partner Assistant (site/partner/incident/report/deployment summaries,
  email drafting, suggested actions).
- Alerts Center (uptime, offline, revenue, invoices, delays, inactivity,
  discrepancies, utilization opportunities).
- Documents & Contracts, Reports, Settings.

## Phase 3 — Integrations & intelligence (next)
- **OCPP / CSMS integration** — live session & status ingestion; auto-incidents.
- **Accounting integration** — push royalty statements; pull payment status.
- **Partner SSO & granular roles** — partner org admins, read-only viewers.
- **Predictive analytics** — uptime/fault prediction, demand & revenue
  forecasting, churn-risk scoring per partner.
- **Automated communication** — scheduled monthly reports, incident updates and
  inactivity nudges sent on the operator's behalf (with review/approve).
- **Public / partner API & webhooks** — let partners pull their own data.
- **Mobile-optimised partner portal** and email digests.
- **Multi-region / multi-currency**, white-label theming per CPO.

## Cross-cutting
- Write paths (create/update incidents, issue statements, launch campaigns,
  upload documents) once Postgres is wired in.
- Audit log of partner-visible changes.
- E2E tests for the partner-scoped views.
