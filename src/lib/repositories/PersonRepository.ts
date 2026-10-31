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
      WITH headshot_people AS (
        SELECT p."id", p."biography"
        FROM "people" p
        WHERE p."headshotUrl" IS NOT NULL AND BTRIM(p."headshotUrl") <> ''
          AND NOT EXISTS (
            SELECT 1 FROM "seo_pages" s
            WHERE s."seoableType" = 'Person' AND s."seoableId" = p."id" AND (s."isNoindex" OR NOT s."inSitemap")
          )
      ), published_credits AS (
        SELECT mp."personId", count(DISTINCT mp."movieId") AS credit_count
        FROM "movie_people" mp
        JOIN "movies" m ON m."id" = mp."movieId" AND m."status" = 'PUBLISHED' AND m."deletedAt" IS NULL
        WHERE mp."personId" IN (SELECT "id" FROM headshot_people)
        GROUP BY mp."personId"
      )
      SELECT count(*)::bigint AS "count"
      FROM headshot_people hp
      JOIN published_credits pc ON pc."personId" = hp."id"
      WHERE pc.credit_count >= 3
         OR (pc.credit_count >= 1 AND LENGTH(BTRIM(COALESCE(hp."biography", ''))) >= 160)
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
      WITH headshot_people AS (
        SELECT p."id", p."slug", p."updatedAt", p."biography"
        FROM "people" p
        WHERE p."headshotUrl" IS NOT NULL AND BTRIM(p."headshotUrl") <> ''
          AND NOT EXISTS (
            SELECT 1 FROM "seo_pages" s
            WHERE s."seoableType" = 'Person' AND s."seoableId" = p."id" AND (s."isNoindex" OR NOT s."inSitemap")
          )
      ), published_credits AS (
        SELECT mp."personId", count(DISTINCT mp."movieId") AS credit_count
        FROM "movie_people" mp
        JOIN "movies" m ON m."id" = mp."movieId" AND m."status" = 'PUBLISHED' AND m."deletedAt" IS NULL
        WHERE mp."personId" IN (SELECT "id" FROM headshot_people)
        GROUP BY mp."personId"
      )
      SELECT hp."slug", hp."updatedAt"
      FROM headshot_people hp
      JOIN published_credits pc ON pc."personId" = hp."id"
      WHERE pc.credit_count >= 3
         OR (pc.credit_count >= 1 AND LENGTH(BTRIM(COALESCE(hp."biography", ''))) >= 160)
      ORDER BY hp."slug" ASC
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
