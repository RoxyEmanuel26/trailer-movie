import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from './base.types';

export class TrailerRepository {
  static async findBySourceId(movieId: string, sourceId: string, db: DbClient = prisma) {
    return db.trailer.findUnique({
      where: {
        movieId_sourceId: {
          movieId,
          sourceId,
        },
      },
    });
  }

  static async create(data: Prisma.TrailerUncheckedCreateInput, db: DbClient = prisma) {
    return db.trailer.create({ data });
  }

  static async findActiveByMovie(movieId: string, db: DbClient = prisma) {
    return db.trailer.findMany({
      where: { movieId, status: 'ACTIVE' },
      orderBy: { isPrimary: 'desc' },
    });
  }
}
