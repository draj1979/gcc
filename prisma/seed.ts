import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: true });

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";
import { GCCS } from "../lib/gcc-data";

neonConfig.webSocketConstructor = ws;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const adapter = new PrismaNeon({ connectionString });
  const prisma = new PrismaClient({ adapter });

  console.log(`Seeding ${GCCS.length} GCCs…`);

  await prisma.leader.deleteMany();
  await prisma.indiaLocation.deleteMany();
  await prisma.gcc.deleteMany();

  for (const g of GCCS) {
    await prisma.gcc.create({
      data: {
        id: g.id,
        parentCompany: g.parentCompany,
        hqCountry: g.hqCountry,
        yearEstablishedInIndia: g.yearEstablishedInIndia,
        totalHeadcount: g.totalHeadcount,
        services: g.servicesFunctions,
        techStack: g.techStack,
        hiringStatus: g.hiringStatus,
        website: g.website ?? null,
        notes: g.notes ?? null,
        locations: {
          create: g.indiaLocations.map((l) => ({
            city: l.city,
            area: l.area ?? null,
            lat: l.lat,
            lng: l.lng,
            headcount: l.headcount ?? null,
          })),
        },
        leaders: {
          create: g.leadership.map((p) => ({ name: p.name, title: p.title })),
        },
      },
    });
    console.log(`  ✓ ${g.parentCompany}`);
  }

  await prisma.$disconnect();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
