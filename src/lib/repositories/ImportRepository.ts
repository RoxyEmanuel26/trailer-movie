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

    const [data, total] = await prisma.$transaction([
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
}
