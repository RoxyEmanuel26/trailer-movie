
import { prisma } from "../src/lib/prisma";

async function run() {
  const updated = await prisma.$executeRawUnsafe(`UPDATE "movies" SET "aiEnrichmentStatus" = 'PENDING' WHERE "aiEnrichmentStatus" IS NULL`);
  console.log("Backfilled rows:", updated);
  
  await prisma.$executeRawUnsafe(`ALTER TABLE "movies" ALTER COLUMN "aiEnrichmentStatus" SET DEFAULT 'PENDING'`);
  console.log("Added DEFAULT PENDING to aiEnrichmentStatus column.");
}

run().finally(() => prisma.$disconnect());

