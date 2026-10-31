import { Prisma } from '@prisma/client';
import { prisma } from '../src/lib/prisma';

function parseRetentionDays(argv: string[]): number {
  const arg = argv.find((item) => item.startsWith('--days='));
  if (!arg) return 14;
  const parsed = Number.parseInt(arg.slice('--days='.length), 10);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 365) {
    throw new Error('--days must be an integer between 1 and 365');
  }
  return parsed;
}

async function main() {
  const days = parseRetentionDays(process.argv.slice(2));
  const dryRun = process.argv.includes('--dry-run');
  const cutoff = new Date(Date.now() - days * 86_400_000);
  const batchSize = 10_000;

  const eligibleRows = await prisma.$queryRaw<Array<{ count: bigint | number }>>(Prisma.sql`
    SELECT COUNT(*) AS count
    FROM "import_jobs"
    WHERE "status" IN ('COMPLETED', 'SKIPPED', 'CANCELED')
      AND "completedAt" < ${cutoff}
  `);
  const eligible = Number(eligibleRows[0]?.count || 0);
  process.stdout.write(
    `[prune-import-jobs] Found ${eligible.toLocaleString()} terminal import_jobs older than ${days} day(s) (cutoff ${cutoff.toISOString()}).\n`,
  );

  if (dryRun || eligible === 0) {
    if (dryRun) process.stdout.write('[prune-import-jobs] Dry run complete — no rows deleted.\n');
    return;
  }

  let totalDeleted = 0;
  while (true) {
    const deleted = await prisma.$executeRaw(Prisma.sql`
      DELETE FROM "import_jobs"
      WHERE "id" IN (
        SELECT "id"
        FROM "import_jobs"
        WHERE "status" IN ('COMPLETED', 'SKIPPED', 'CANCELED')
          AND "completedAt" < ${cutoff}
        ORDER BY "completedAt" ASC
        LIMIT ${batchSize}
      )
    `);
    totalDeleted += deleted;
    process.stdout.write(`[prune-import-jobs] Deleted batch of ${deleted} rows (total: ${totalDeleted.toLocaleString()}).\n`);
    if (deleted < batchSize) break;
  }

  process.stdout.write('[prune-import-jobs] Running VACUUM (ANALYZE) on "import_jobs" to mark freed pages reusable...\n');
  await prisma.$executeRawUnsafe('VACUUM (ANALYZE) "import_jobs"');
  process.stdout.write(`[prune-import-jobs] Done. Reclaimed ${totalDeleted.toLocaleString()} terminal import_jobs rows.\n`);
}

main()
  .catch((error) => {
    console.error('[prune-import-jobs] Failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
