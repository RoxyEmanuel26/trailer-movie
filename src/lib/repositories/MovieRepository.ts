import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from './base.types';

export class MovieRepository {
  static async findById(id: string, db: DbClient = prisma) {
    return db.movie.findUnique({
      where: { id },
      include: {
        genres: { include: { genre: true } },
        people: { include: { person: true } },
        trailers: true,
      },
    });
  }

  static async findByTmdbId(tmdbId: number, db: DbClient = prisma) {
    return db.movie.findUnique({
      where: { tmdbId },
    });
  }

  static async create(data: Prisma.MovieCreateInput, db: DbClient = prisma) {
    return db.movie.create({ data });
  }

  static async update(id: string, data: Prisma.MovieUpdateInput, db: DbClient = prisma) {
    return db.movie.update({ where: { id }, data });
  }

  static async upsert(
    tmdbId: number,
    create: Prisma.MovieCreateInput,
    update: Prisma.MovieUpdateInput,
    db: DbClient = prisma
  ) {
    return db.movie.upsert({
      where: { tmdbId },
      create,
      update,
    });
  }

  static async delete(id: string, db: DbClient = prisma) {
    // Soft delete per architecture
    return db.movie.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  static async list(params: { skip?: number; take?: number }, db: DbClient = prisma) {
    return db.movie.findMany({
      skip: params.skip,
      take: params.take,
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }
}
