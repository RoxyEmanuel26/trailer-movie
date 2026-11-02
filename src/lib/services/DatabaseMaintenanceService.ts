import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export class DatabaseMaintenanceService {
  private static isRunning = false;

  /**
   * Automatically prunes stale transient records:
   * 1. Terminal import_jobs older than retention days
   * 2. Raw analytics_events older than retention days
   * Note: aggregated totals in daily_metrics are never deleted.
   */
  static async runPruning(days = 7): Promise<{ deletedJobs: number; deletedEvents: number }> {
    if (this.isRunning) {
      logger.info('[DatabaseMaintenance] Pruning already in progress, skipping concurrent run');
      return { deletedJobs: 0, deletedEvents: 0 };
    }

    this.isRunning = true;
    try {
      const cutoff = new Date(Date.now() - days * 86_400_000);
      const batchSize = 5_000;

      // 1. Prune finished import_jobs
      let deletedJobs = 0;
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
        if (deleted < batchSize) break;
      }

      // 2. Prune raw analytics_events older than cutoff
      let deletedEvents = 0;
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
        if (deleted < batchSize) break;
      }

      if (deletedJobs > 0 || deletedEvents > 0) {
        logger.info(
          { deletedJobs, deletedEvents, cutoff: cutoff.toISOString() },
          '[DatabaseMaintenance] Automated database pruning complete',
        );
      }

      return { deletedJobs, deletedEvents };
    } catch (error) {
      logger.error({ err: error }, '[DatabaseMaintenance] Error during automated database pruning');
      return { deletedJobs: 0, deletedEvents: 0 };
    } finally {
      this.isRunning = false;
    }
  }
}
