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

  static async linkMovieGenre(movieId: string, genreId: string, db: DbClient = prisma) {
    return db.movieGenre.create({
      data: { movieId, genreId },
    });
  }
}
