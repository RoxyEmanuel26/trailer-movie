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
    const rows = await db.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS "count"
      FROM "people" p
      WHERE NULLIF(BTRIM(p."headshotUrl"), '') IS NOT NULL
        AND (
          LENGTH(BTRIM(COALESCE(p."biography", ''))) >= 160
          OR (
            SELECT COUNT(DISTINCT mp."movieId")
            FROM "movie_people" mp
            JOIN "movies" m ON m."id" = mp."movieId"
            WHERE mp."personId" = p."id"
              AND m."status" = 'PUBLISHED'
              AND m."deletedAt" IS NULL
          ) >= 3
        )
        AND EXISTS (
          SELECT 1
          FROM "movie_people" mp
          JOIN "movies" m ON m."id" = mp."movieId"
          WHERE mp."personId" = p."id"
            AND m."status" = 'PUBLISHED'
            AND m."deletedAt" IS NULL
        )
    `);
    return Number(rows[0]?.count || 0);
  }

  static async listIndexableForSitemap(
    params: { skip?: number; take?: number } = {},
    db: DbClient = prisma
  ) {
    const skip = Math.max(0, params.skip || 0);
    const take = Math.min(45_000, Math.max(1, params.take || 45_000));
    return db.$queryRaw<Array<{ slug: string; updatedAt: Date }>>(Prisma.sql`
      SELECT p."slug", p."updatedAt"
      FROM "people" p
      WHERE NULLIF(BTRIM(p."headshotUrl"), '') IS NOT NULL
        AND (
          LENGTH(BTRIM(COALESCE(p."biography", ''))) >= 160
          OR (
            SELECT COUNT(DISTINCT mp."movieId")
            FROM "movie_people" mp
            JOIN "movies" m ON m."id" = mp."movieId"
            WHERE mp."personId" = p."id"
              AND m."status" = 'PUBLISHED'
              AND m."deletedAt" IS NULL
          ) >= 3
        )
        AND EXISTS (
          SELECT 1
          FROM "movie_people" mp
          JOIN "movies" m ON m."id" = mp."movieId"
          WHERE mp."personId" = p."id"
            AND m."status" = 'PUBLISHED'
            AND m."deletedAt" IS NULL
        )
      ORDER BY p."slug" ASC
      OFFSET ${skip}
      LIMIT ${take}
    `);
  }

  static isIndexableProfile(person: {
    headshotUrl: string | null;
    biography: string | null;
    movies: Array<{ movieId?: string; movie: { id: string } }>;
  }) {
    const creditCount = new Set(person.movies.map((credit) => credit.movie.id)).size;
    return Boolean(
      person.headshotUrl?.trim() &&
        ((person.biography?.trim().length || 0) >= 160 || creditCount >= 3)
    );
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
