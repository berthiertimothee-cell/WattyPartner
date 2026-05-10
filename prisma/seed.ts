/**
 * PartnerOS — database seed.
 *
 * Loads the demo dataset (the same one the MVP serves from memory) into
 * Postgres via Prisma. Run with `npm run seed` after `prisma migrate dev`.
 *
 * For brevity this seeds the core entities and the maintenance providers; the
 * site metric series, incidents, reports, deployments, campaigns and documents
 * follow the exact same pattern using the arrays exported from
 * `src/lib/mock-data.ts`. Extend `main()` to load them all when wiring the
 * production database.
 */
import { PrismaClient } from "@prisma/client";
import {
  campaigns,
  chargers,
  contracts,
  deployments,
  documents,
  incidents,
  maintenanceProviders,
  notifications,
  organization,
  partners,
  revenueReports,
  sites,
  users,
} from "../src/lib/mock-data";

const prisma = new PrismaClient();

async function main() {
  await prisma.organization.upsert({
    where: { id: organization.id },
    update: {},
    create: {
      id: organization.id,
      name: organization.name,
      legalName: organization.legalName,
      country: organization.country,
      currency: organization.currency,
      contactEmail: organization.contactEmail,
    },
  });

  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: { id: u.id, organizationId: u.organizationId, name: u.name, email: u.email, role: u.role as any, avatarColor: u.avatarColor, partnerId: u.partnerId ?? null },
    });
  }

  for (const p of partners) {
    await prisma.partner.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        organizationId: p.organizationId,
        name: p.name,
        type: p.type as any,
        contactName: p.contactName,
        contactEmail: p.contactEmail,
        contactPhone: p.contactPhone ?? null,
        city: p.city,
        region: p.region,
        logoColor: p.logoColor,
        since: new Date(p.since),
        royaltyRate: p.royaltyRate,
        status: p.status as any,
        lastContactAt: new Date(p.lastContactAt),
        accountManagerId: p.accountManagerId,
      },
    });
  }

  for (const mp of maintenanceProviders) {
    await prisma.maintenanceProvider.upsert({
      where: { id: mp.id },
      update: {},
      create: { id: mp.id, organizationId: mp.organizationId, name: mp.name, contactEmail: mp.contactEmail, phone: mp.phone, regions: mp.regions, avgResolutionHours: mp.avgResolutionHours, rating: mp.rating },
    });
  }

  for (const s of sites) {
    await prisma.site.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        organizationId: s.organizationId,
        partnerId: s.partnerId,
        name: s.name,
        address: s.address,
        city: s.city,
        region: s.region,
        country: s.country,
        lat: s.lat,
        lng: s.lng,
        photoColor: s.photoColor,
        status: s.status as any,
        electricitySource: s.electricitySource as any,
        commissionedAt: s.commissionedAt ? new Date(s.commissionedAt) : null,
        expectedGoLive: s.expectedGoLive ? new Date(s.expectedGoLive) : null,
        operatorName: s.operatorName,
        chargers: { create: chargers.filter((c) => c.siteId === s.id).map((c) => ({ id: c.id, model: c.model, vendor: c.vendor, powerKw: c.powerKw, connectors: c.connectors, type: c.type as any, status: c.status as any, commissionedAt: new Date(c.commissionedAt) })) },
        monthlyMetrics: { create: s.monthly.map((m) => ({ month: m.month, sessions: m.sessions, energyKwh: m.energyKwh, revenueEur: m.revenueEur, uptimePct: m.uptimePct, avgPriceEurKwh: m.avgPriceEurKwh })) },
      },
    });
  }

  console.log(
    `Seeded: 1 org, ${users.length} users, ${partners.length} partners, ${maintenanceProviders.length} providers, ${sites.length} sites, ${chargers.length} chargers.\n` +
      `Remaining demo arrays available for loading: incidents=${incidents.length}, revenueReports=${revenueReports.length}, deployments=${deployments.length}, campaigns=${campaigns.length}, documents=${documents.length}, contracts=${contracts.length}, notifications=${notifications.length}.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
