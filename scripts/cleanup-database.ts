import { Prisma } from '@prisma/client';
import { prisma } from '../src/lib/prisma';

function parseRetentionDays(argv: string[]): number {
  const arg = argv.find((item) => item.startsWith('--days='));
  if (!arg) return 7; // Default 7 days retention for events and finished jobs
  const parsed = Number.parseInt(arg.slice('--days='.length), 10);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 365) {
    throw new Error('--days must be an integer between 1 and 365');
  }
  return parsed;
}

async function main() {
  const days = parseRetentionDays(process.argv.slice(2));
  const cutoff = new Date(Date.now() - days * 86_400_000);
  const batchSize = 10_000;

  process.stdout.write(`[cleanup-database] Starting database cleanup (retention cutoff: ${cutoff.toISOString()}, ${days} days)...\n`);

  // 1. Clean terminal import_jobs
  const eligibleJobsRows = await prisma.$queryRaw<Array<{ count: bigint | number }>>(Prisma.sql`
    SELECT COUNT(*) AS count
    FROM "import_jobs"
    WHERE "status" IN ('COMPLETED', 'SKIPPED', 'CANCELED')
      AND ("completedAt" < ${cutoff} OR "completedAt" IS NULL)
  `);
  const eligibleJobs = Number(eligibleJobsRows[0]?.count || 0);
  process.stdout.write(`[cleanup-database] Found ${eligibleJobs.toLocaleString()} finished import_jobs to prune.\n`);

  let deletedJobs = 0;
  if (eligibleJobs > 0) {
    while (true) {
      const deleted = await prisma.$executeRaw(Prisma.sql`
        DELETE FROM "import_jobs"
        WHERE "id" IN (
          SELECT "id"
          FROM "import_jobs"
          WHERE "status" IN ('COMPLETED', 'SKIPPED', 'CANCELED')
            AND ("completedAt" < ${cutoff} OR "completedAt" IS NULL)
          LIMIT ${batchSize}
        )
      `);
      deletedJobs += deleted;
      process.stdout.write(`[cleanup-database] Deleted ${deleted} import_jobs (total: ${deletedJobs.toLocaleString()}).\n`);
      if (deleted < batchSize) break;
    }
  }

  // 2. Clean raw analytics_events older than cutoff
  // (Note: Aggregated daily counts are safely stored in daily_metrics and are NOT deleted)
  const eligibleEventsRows = await prisma.$queryRaw<Array<{ count: bigint | number }>>(Prisma.sql`
    SELECT COUNT(*) AS count
    FROM "analytics_events"
    WHERE "createdAt" < ${cutoff}
  `);
  const eligibleEvents = Number(eligibleEventsRows[0]?.count || 0);
  process.stdout.write(`[cleanup-database] Found ${eligibleEvents.toLocaleString()} raw analytics_events to prune.\n`);

  let deletedEvents = 0;
  if (eligibleEvents > 0) {
    while (true) {
      const deleted = await prisma.$executeRaw(Prisma.sql`
        DELETE FROM "analytics_events"
        WHERE "id" IN (
          SELECT "id"
          FROM "analytics_events"
          WHERE "createdAt" < ${cutoff}
          LIMIT ${batchSize}
        )
      `);
      deletedEvents += deleted;
      process.stdout.write(`[cleanup-database] Deleted ${deleted} analytics_events (total: ${deletedEvents.toLocaleString()}).\n`);
      if (deleted < batchSize) break;
    }
  }

  // 3. Attempt VACUUM ANALYZE to reclaim space (graceful fallback if restricted by hosting provider)
  process.stdout.write('[cleanup-database] Reclaiming space with VACUUM ANALYZE...\n');
  for (const table of ['import_jobs', 'analytics_events']) {
    try {
      await prisma.$executeRawUnsafe(`VACUUM (ANALYZE) "${table}"`);
      process.stdout.write(`[cleanup-database] Successfully vacuumed "${table}".\n`);
    } catch (err: any) {
      process.stdout.write(`[cleanup-database] Note: VACUUM on "${table}" skipped (${err.message}). Space is now reusable for upcoming inserts.\n`);
    }
  }

  process.stdout.write(
    `[cleanup-database] Complete! Successfully cleaned ${deletedJobs.toLocaleString()} import_jobs and ${deletedEvents.toLocaleString()} analytics_events.\n`,
  );
}

main()
  .catch((error) => {
    console.error('[cleanup-database] Error:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
