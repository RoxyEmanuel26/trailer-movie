import { Prisma, PersonRoleType } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from './base.types';

const publicProfileInclude = {
  movies: {
    where: {
      movie: {
        deletedAt: null,
        status: 'PUBLISHED',
      },
    },
    include: {
      movie: {
        include: {
          genres: { include: { genre: true } },
        },
      },
    },
    orderBy: {
      movie: {
        releaseDate: 'desc',
      },
    },
  },
} satisfies Prisma.PersonInclude;

export class PersonRepository {
  static async resolveCanonicalSlug(routeParam: string, db: DbClient = prisma) {
    const bySlug = await db.person.findUnique({
      where: { slug: routeParam },
      select: { slug: true },
    });
    if (bySlug) return bySlug.slug;

    const byLegacyId = await db.person.findUnique({
      where: { id: routeParam },
      select: { slug: true },
    });
    if (byLegacyId) return byLegacyId.slug;

    const tmdbIdMatch = routeParam.match(/-(\d+)$/);
    const tmdbId = tmdbIdMatch ? Number(tmdbIdMatch[1]) : NaN;
    if (!Number.isSafeInteger(tmdbId) || tmdbId <= 0) return null;

    const byTmdbId = await db.person.findUnique({
      where: { tmdbId },
      select: { slug: true },
    });
    return byTmdbId?.slug || null;
  }

  static async findPublicProfileBySlug(slug: string, db: DbClient = prisma) {
    return db.person.findUnique({
      where: { slug },
      include: publicProfileInclude,
    });
  }

  static async findPublicProfileById(id: string, db: DbClient = prisma) {
    return db.person.findUnique({
      where: { id },
      include: publicProfileInclude,
    });
  }

  static async findPublicProfileByTmdbId(tmdbId: number, db: DbClient = prisma) {
    return db.person.findUnique({
      where: { tmdbId },
      include: publicProfileInclude,
    });
  }

  static async countIndexableForSitemap(db: DbClient = prisma) {
    return db.person.count({
      where: {
        movies: {
          some: {
            movie: {
              status: 'PUBLISHED',
              deletedAt: null,
            },
          },
        },
      },
    });
  }

  static async listIndexableForSitemap(
    params: { skip?: number; take?: number } = {},
    db: DbClient = prisma
  ) {
    return db.person.findMany({
      where: {
        movies: {
          some: {
            movie: {
              status: 'PUBLISHED',
              deletedAt: null,
            },
          },
        },
      },
      select: { slug: true, updatedAt: true },
      orderBy: { slug: 'asc' },
      skip: params.skip,
      take: params.take,
    });
  }

  static async upsert(
    tmdbId: number,
    create: Prisma.PersonCreateInput,
    update: Prisma.PersonUpdateInput,
    db: DbClient = prisma
  ) {
    return db.person.upsert({
      where: { tmdbId },
      create,
      update,
    });
  }

  static async clearMovieRole(movieId: string, roleType: PersonRoleType, db: DbClient = prisma) {
    return db.moviePerson.deleteMany({
      where: { movieId, roleType },
    });
  }

  static async linkMoviePerson(
    data: Prisma.MoviePersonUncheckedCreateInput,
    db: DbClient = prisma
  ) {
    return db.moviePerson.upsert({
      where: {
        movieId_personId_roleType: {
          movieId: data.movieId as string,
          personId: data.personId as string,
          roleType: data.roleType as PersonRoleType,
        },
      },
      create: data,
      update: {
        characterName: data.characterName,
        sortOrder: data.sortOrder,
      },
    });
  }
}
