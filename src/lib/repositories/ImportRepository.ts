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
}
