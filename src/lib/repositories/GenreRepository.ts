import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from './base.types';

export class GenreRepository {
  static async upsert(
    tmdbId: number,
    create: Prisma.GenreCreateInput,
    update: Prisma.GenreUpdateInput,
    db: DbClient = prisma
  ) {
    return db.genre.upsert({
      where: { tmdbId },
      create,
      update,
    });
  }

  static async clearMovieGenres(movieId: string, db: DbClient = prisma) {
    return db.movieGenre.deleteMany({
      where: { movieId },
    });
  }

  static async list(db: DbClient = prisma) {
    return db.genre.findMany({
      orderBy: { name: 'asc' },
    });
  }

  static async findById(id: string, db: DbClient = prisma) {
    return db.genre.findUnique({
      where: { id },
    });
  }

  static async findBySlug(slug: string, db: DbClient = prisma) {
    return db.genre.findUnique({
      where: { slug },
    });
  }

  static async create(data: Prisma.GenreCreateInput, db: DbClient = prisma) {
    return db.genre.create({ data });
  }

  static async update(id: string, data: Prisma.GenreUpdateInput, db: DbClient = prisma) {
    return db.genre.update({ where: { id }, data });
  }

  static async delete(id: string, db: DbClient = prisma) {
    return db.genre.delete({ where: { id } });
  }

  static async deleteMany(ids: string[], db: DbClient = prisma) {
    return db.genre.deleteMany({
      where: { id: { in: ids } },
    });
  }

  static async linkMovieGenre(movieId: string, genreId: string, db: DbClient = prisma) {
    return db.movieGenre.create({
      data: { movieId, genreId },
    });
  }
}
