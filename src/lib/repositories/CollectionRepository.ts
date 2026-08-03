import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from './base.types';

export class CollectionRepository {
  static async findBySlug(slug: string, db: DbClient = prisma) {
    return db.collection.findUnique({
      where: { slug },
      include: {
        movies: {
          include: { movie: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  static async listActive(db: DbClient = prisma) {
    return db.collection.findMany({
      where: { isActive: true },
    });
  }
}
