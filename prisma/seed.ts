// Seed the database from the mock dataset.
//
// Usage (after configuring DATABASE_URL and running `prisma migrate dev`):
//   npm run seed
//
// This is intentionally minimal — it mirrors src/lib/mock-data.ts into Postgres
// so a freshly migrated database matches the MVP's mock state. Recommendations
// and alerts are derived at runtime by the engine and are not seeded here.

import { PrismaClient } from "@prisma/client";
import {
  ORGANIZATION,
  USERS,
  SITES,
  COMPETITORS,
  PRICE_OBSERVATIONS,
  chargersForSite,
  utilizationForSite,
} from "../src/lib/mock-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding VoltYield database from mock data…");

  await prisma.organization.upsert({
    where: { id: ORGANIZATION.id },
    update: {},
    create: {
      id: ORGANIZATION.id,
      name: ORGANIZATION.name,
      country: ORGANIZATION.country,
      currency: ORGANIZATION.currency,
      targetGapAbove: ORGANIZATION.settings.targetGapAbove,
      lowUtilizationThreshold: ORGANIZATION.settings.lowUtilizationThreshold,
      highUtilizationThreshold: ORGANIZATION.settings.highUtilizationThreshold,
      minPriceStep: ORGANIZATION.settings.minPriceStep,
      autoApply: ORGANIZATION.settings.autoApply,
      createdAt: new Date(ORGANIZATION.createdAt),
    },
  });

  for (const u of USERS) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        organizationId: u.organizationId,
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: new Date(u.createdAt),
      },
    });
  }

  for (const s of SITES) {
    await prisma.site.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        organizationId: s.organizationId,
        name: s.name,
        address: s.address,
        city: s.city,
        country: s.country,
        lat: s.lat,
        lng: s.lng,
        operatorName: s.operatorName,
        maxPowerKw: s.maxPowerKw,
        currentPricePerKwh: s.currentPricePerKwh,
        currency: s.currency,
        utilizationRate: s.utilizationRate,
        sessionsPerDay: s.sessionsPerDay,
        revenuePerMonth: s.revenuePerMonth,
        uptime: s.uptime,
        status: s.status,
        createdAt: new Date(s.createdAt),
      },
    });

    for (const c of chargersForSite(s.id)) {
      await prisma.charger.upsert({
        where: { id: c.id },
        update: {},
        create: { id: c.id, siteId: c.siteId, label: c.label, powerKw: c.powerKw, connectorTypes: c.connectorTypes, count: c.count },
      });
    }

    const util = utilizationForSite(s.id);
    if (util) {
      await prisma.utilizationData.create({
        data: { siteId: s.id, asOf: new Date(util.asOf), hourly: util.hourly as unknown as object, weekday: util.weekday },
      });
    }
  }

  for (const c of COMPETITORS) {
    await prisma.competitor.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        siteId: c.siteId,
        name: c.name,
        operatorName: c.operatorName,
        lat: c.lat,
        lng: c.lng,
        distanceKm: c.distanceKm,
        maxPowerKw: c.maxPowerKw,
        pricePerKwh: c.pricePerKwh,
        currency: c.currency,
        availability: c.availability,
        source: c.source,
        lastSeenAt: new Date(c.lastSeenAt),
      },
    });
  }

  for (const o of PRICE_OBSERVATIONS) {
    await prisma.priceObservation.upsert({
      where: { id: o.id },
      update: {},
      create: { id: o.id, siteId: o.siteId, competitorId: o.competitorId ?? undefined, pricePerKwh: o.pricePerKwh, currency: o.currency, observedAt: new Date(o.observedAt), source: o.source },
    });
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
