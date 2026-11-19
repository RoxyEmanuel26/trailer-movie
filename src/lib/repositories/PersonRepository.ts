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
        select: {
          id: true,
          title: true,
          slug: true,
          posterUrl: true,
          releaseDate: true,
          voteAverage: true,
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
      WITH distinct_credits AS (
        SELECT mp."personId", mp."movieId"
        FROM "movie_people" mp
        JOIN "movies" m ON m."id" = mp."movieId"
        WHERE m."status" = 'PUBLISHED' AND m."deletedAt" IS NULL
        GROUP BY mp."personId", mp."movieId"
      ), published_credits AS (
        SELECT "personId", COUNT(*)::int AS credit_count
        FROM distinct_credits
        GROUP BY "personId"
      ), bio_people AS (
        SELECT p2."id"
        FROM "people" p2
        WHERE p2."headshotUrl" IS NOT NULL AND BTRIM(p2."headshotUrl") <> ''
          AND LENGTH(BTRIM(COALESCE(p2."biography", ''))) >= 160
      )
      SELECT COUNT(*)::bigint AS "count"
      FROM "people" p
      JOIN published_credits pc ON pc."personId" = p."id"
      LEFT JOIN bio_people bp ON bp."id" = p."id"
      WHERE p."headshotUrl" IS NOT NULL AND BTRIM(p."headshotUrl") <> ''
        AND (pc.credit_count >= 3 OR (pc.credit_count >= 1 AND bp."id" IS NOT NULL))
        AND NOT EXISTS (
          SELECT 1 FROM "seo_pages" s
          WHERE s."seoableType" = 'Person' AND s."seoableId" = p."id" AND (s."isNoindex" OR NOT s."inSitemap")
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
      WITH distinct_credits AS (
        SELECT mp."personId", mp."movieId"
        FROM "movie_people" mp
        JOIN "movies" m ON m."id" = mp."movieId"
        WHERE m."status" = 'PUBLISHED' AND m."deletedAt" IS NULL
        GROUP BY mp."personId", mp."movieId"
      ), published_credits AS (
        SELECT "personId", COUNT(*)::int AS credit_count
        FROM distinct_credits
        GROUP BY "personId"
      ), bio_people AS (
        SELECT p2."id"
        FROM "people" p2
        WHERE p2."headshotUrl" IS NOT NULL AND BTRIM(p2."headshotUrl") <> ''
          AND LENGTH(BTRIM(COALESCE(p2."biography", ''))) >= 160
      )
      SELECT p."slug", p."updatedAt"
      FROM "people" p
      JOIN published_credits pc ON pc."personId" = p."id"
      LEFT JOIN bio_people bp ON bp."id" = p."id"
      WHERE p."headshotUrl" IS NOT NULL AND BTRIM(p."headshotUrl") <> ''
        AND (pc.credit_count >= 3 OR (pc.credit_count >= 1 AND bp."id" IS NOT NULL))
        AND NOT EXISTS (
          SELECT 1 FROM "seo_pages" s
          WHERE s."seoableType" = 'Person' AND s."seoableId" = p."id" AND (s."isNoindex" OR NOT s."inSitemap")
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
        creditCount > 0 &&
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
