import { Prisma, ImportJobStatus } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from './base.types';

export class ImportRepository {
  static async create(tmdbId: number, entityType = 'Movie', db: DbClient = prisma) {
    return db.importJob.create({
      data: {
        tmdbId,
        entityType,
        status: ImportJobStatus.PENDING,
      },
    });
  }

  static async updateStatus(
    id: string,
    status: ImportJobStatus,
    logs?: any,
    db: DbClient = prisma
  ) {
    return db.importJob.update({
      where: { id },
      data: {
        status,
        logs: logs ? (logs as any) : Prisma.DbNull,
      },
    });
  }

  static async findById(id: string, db: DbClient = prisma) {
    return db.importJob.findUnique({
      where: { id },
    });
  }

  static async delete(id: string, db: DbClient = prisma) {
    return db.importJob.delete({
      where: { id },
    });
  }

  static async list(params: {
    skip?: number;
    take?: number;
    status?: ImportJobStatus;
  }, db: DbClient = prisma) {
    const where: Prisma.ImportJobWhereInput = {};
    if (params.status) {
      where.status = params.status;
    }

    const [data, total] = await Promise.all([
      db.importJob.findMany({
        skip: params.skip,
        take: params.take,
        where,
        orderBy: { createdAt: 'desc' },
      }),
      db.importJob.count({ where }),
    ]);

    return { data, total };
  }

  static async getOverview(db: DbClient = prisma) {
    const [queued, running, completed, failed] = await Promise.all([
      db.importJob.count({ where: { status: 'PENDING' } }),
      db.importJob.count({ where: { status: 'IN_PROGRESS' } }),
      db.importJob.count({ where: { status: 'COMPLETED' } }),
      db.importJob.count({ where: { status: 'FAILED' } }),
    ]);

    const recentJobs = await db.importJob.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return {
      stats: { queued, running, completed, failed },
      recentJobs,
    };
  }

  static async recoverStuckJobs(thresholdDate: Date, db: DbClient = prisma) {
    return db.importJob.updateMany({
      where: {
        status: ImportJobStatus.IN_PROGRESS,
        updatedAt: { lt: thresholdDate }
      },
      data: { status: ImportJobStatus.PENDING }
    });
  }

  static async fetchJobsForProcessing(limit: number, db: DbClient = prisma) {
    // Prisma doesn't natively support SKIP LOCKED in findMany, so we use queryRaw
    return db.$queryRaw<{ id: string, tmdbId: number }[]>`
      SELECT id, "tmdbId" 
      FROM "import_jobs" 
      WHERE status = 'PENDING' 
      ORDER BY "createdAt" ASC 
      LIMIT ${limit} 
      FOR UPDATE SKIP LOCKED
    `;
  }

  static async markJobsInProgress(jobIds: string[], db: DbClient = prisma) {
    return db.importJob.updateMany({
      where: { id: { in: jobIds } },
      data: { status: ImportJobStatus.IN_PROGRESS }
    });
  }
}
