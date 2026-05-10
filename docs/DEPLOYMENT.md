# PartnerOS — Deployment

The MVP runs as a standard Next.js 14 app. It works out of the box in **mock
mode** (no database, no API keys). Below: local, Vercel, Docker, and the
database/AI cutover.

---

## Prerequisites

- Node.js 20+
- (Optional, for live mode) PostgreSQL 14+
- (Optional, for real AI) an Anthropic or OpenAI API key
- (Optional, for real maps) a Mapbox token

## Environment

Copy `.env.example` → `.env`:

```ini
DATA_SOURCE=mock                          # "mock" (default) or "db"
DATABASE_URL=postgresql://partneros:partneros@localhost:5432/partneros?schema=public
ANTHROPIC_API_KEY=                        # optional — enables a real AI model
AI_MODEL=claude-sonnet-4-6
NEXT_PUBLIC_MAPBOX_TOKEN=                 # optional — site maps
SMTP_URL=                                 # optional — partner emails / report delivery
```

## Local development

```bash
npm install
npm run dev          # http://localhost:3000  → /dashboard
npm run typecheck    # tsc --noEmit
npm run build && npm start   # production build locally
```

## Deploy to Vercel (recommended for the MVP)

1. Push the repo and import it in Vercel.
2. Framework preset: **Next.js** (auto-detected). Build command `next build`,
   output handled automatically.
3. Set env vars (`DATA_SOURCE`, and the optional keys) in the Vercel project.
4. Deploy. In mock mode there is nothing else to configure.

## Deploy with Docker

```dockerfile
# Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t partneros .
docker run -p 3000:3000 --env-file .env partneros
```

For AWS/GCP: run the container on ECS Fargate / Cloud Run, put it behind the
managed load balancer, and use managed Postgres (RDS / Cloud SQL). Store secrets
in Secrets Manager / Secret Manager and inject them as env vars.

## Going live with PostgreSQL

```bash
# 1. set DATABASE_URL in .env and DATA_SOURCE=db
npm run prisma:generate
npm run prisma:migrate        # applies prisma/schema.prisma
npm run seed                  # loads the demo dataset via Prisma
```

Then change `src/lib/data.ts`: each exported function currently reads from
`src/lib/mock-data.ts`; replace the body with the equivalent Prisma query
(`prisma.partner.findMany(...)`, etc.). Because the API routes and pages only
ever call the data layer, nothing else changes. Add write endpoints
(create incident, issue statement, upload document, launch campaign) as
`POST`/`PATCH` route handlers using the same `{ data }` envelope.

## Plugging in a real AI model

In `src/lib/ai.ts`, replace each template body with a single call to your
provider (Claude/OpenAI), passing the **already-computed** metrics and asking
only for prose / drafts (see `docs/ARCHITECTURE.md` §5 for the prompt). Update
`AI_MODEL_ID` so it shows on the AI summary cards. Never let the model compute
financial figures.

## Connecting live operational data

- **OCPP / CSMS:** ingest session and status events from your charge-point
  management system to populate `Charger.status`, `SiteMonthlyMetric` and
  auto-create connectivity/fault `Incident`s.
- **Accounting:** export `RevenueReport` / `RoyaltyLine` to your finance system,
  or pull payment confirmations back in to flip statements to `paid`.
- **Maps:** set `NEXT_PUBLIC_MAPBOX_TOKEN` to render real site maps in place of
  the schematic placeholders.

## Health & observability

- `GET /api/me` is a cheap liveness check.
- Add request logging / tracing at the route-handler layer; the data layer is a
  natural place to add query metrics once Postgres is wired in.
