import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from './base.types';

export class FavoriteRepository {
  static async create(userId: string, movieId: string, db: DbClient = prisma) {
    return db.userFavorite.create({
      data: { userId, movieId },
    });
  }

  static async delete(userId: string, movieId: string, db: DbClient = prisma) {
    return db.userFavorite.delete({
      where: {
        userId_movieId: { userId, movieId },
      },
    });
  }

  static async listByUser(userId: string, db: DbClient = prisma) {
    return db.userFavorite.findMany({
      where: { userId },
      include: { movie: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
