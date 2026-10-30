import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from './base.types';
import { catalogStatsQuery } from '../catalog-stats-query';

export interface CatalogFilters {
  search?: string;
  status?: import('@prisma/client').MovieStatus;
  genreSlug?: string;
  genreIds?: string[];
  collectionSlug?: string;
  tagSlug?: string;
  excludeId?: string;
  countryCodes?: string[];
  languageCodes?: string[];
  releaseYear?: number;
  releaseDateLte?: Date;
  minimumVotes?: number;
}

export const PUBLIC_MOVIE_CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  posterUrl: true,
  releaseDate: true,
  runtimeMinutes: true,
  mpaaRating: true,
  voteAverage: true,
} satisfies Prisma.MovieSelect;

export type PublicMovieCardRecord = Prisma.MovieGetPayload<{
  select: typeof PUBLIC_MOVIE_CARD_SELECT;
}>;

function buildCatalogWhere(params: CatalogFilters): Prisma.MovieWhereInput {
  const where: Prisma.MovieWhereInput = { deletedAt: null };
  const andFilters: Prisma.MovieWhereInput[] = [];

  if (params.search) {
    const terms = params.search.trim().split(/\s+/).filter(Boolean).slice(0, 8);
    if (terms.length) {
      // The existing pg_trgm indexes support ILIKE, whereas Prisma's search
      // expression builds an unindexed tsvector and scans every movie row.
      andFilters.push({
        OR: terms.flatMap((term) => [
          { title: { contains: term, mode: 'insensitive' as const } },
          { originalTitle: { contains: term, mode: 'insensitive' as const } },
          { synopsis: { contains: term, mode: 'insensitive' as const } },
        ]),
      });
    }
  }
  if (params.status) where.status = params.status;
  if (params.excludeId) where.id = { not: params.excludeId };
  if (params.genreIds?.length) where.genres = { some: { genreId: { in: params.genreIds } } };
  else if (params.genreSlug) where.genres = { some: { genre: { slug: params.genreSlug } } };
  if (params.collectionSlug) where.collections = { some: { collection: { slug: params.collectionSlug } } };
  if (params.tagSlug) where.tags = { some: { tag: { slug: params.tagSlug } } };

  const originFilters: Prisma.MovieWhereInput[] = [];
  if (params.countryCodes?.length) originFilters.push({ countries: { some: { country: { isoCode: { in: params.countryCodes } } } } });
  if (params.languageCodes?.length) originFilters.push({ languages: { some: { language: { isoCode: { in: params.languageCodes } } } } });
  if (originFilters.length) andFilters.push({ OR: originFilters });
  if (params.releaseYear) andFilters.push({ releaseDate: { gte: new Date(Date.UTC(params.releaseYear, 0, 1)), lt: new Date(Date.UTC(params.releaseYear + 1, 0, 1)) } });
  if (params.releaseDateLte) andFilters.push({ releaseDate: { lte: params.releaseDateLte } });
  if (params.minimumVotes) andFilters.push({ voteCount: { gte: params.minimumVotes } });
  if (andFilters.length) where.AND = andFilters;
  return where;
}

export class MovieRepository {
  static async getPopularHubCounts(now = new Date(), db: DbClient = prisma) {
    // The hub only displays counts. Do not fetch full movie relations or run
    // Bayesian ranking just to count three links on a small connection pool.
    const rows = await db.$queryRaw<Array<{ mostPopular: number; topRated: number; latestReleases: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS "mostPopular",
        COUNT(*) FILTER (WHERE "voteAverage" IS NOT NULL AND "voteCount" >= 50)::int AS "topRated",
        COUNT(*) FILTER (WHERE "releaseDate" <= ${now})::int AS "latestReleases"
      FROM "public"."movies"
      WHERE "status" = 'PUBLISHED' AND "deletedAt" IS NULL
    `);
    return rows[0] || { mostPopular: 0, topRated: 0, latestReleases: 0 };
  }

  static async countOriginGroups(
    origins: Array<{ slug: string; countryCodes: string[]; languageCodes: string[] }>,
    db: DbClient = prisma,
  ) {
    if (!origins.length) return new Map<string, number>();
    const payload = JSON.stringify(origins);
    const rows = await db.$queryRaw<Array<{ slug: string; total: number }>>(Prisma.sql`
      WITH origin_filters AS (
        SELECT "slug", "countryCodes", "languageCodes"
        FROM jsonb_to_recordset(${payload}::jsonb)
          AS item("slug" text, "countryCodes" jsonb, "languageCodes" jsonb)
      ), eligible_movies AS (
        SELECT movie."id"
        FROM "movies" movie
        WHERE movie."status" = 'PUBLISHED'
          AND movie."deletedAt" IS NULL
          AND movie."importQualityStatus" = 'READY'
          AND movie."posterUrl" IS NOT NULL
          AND movie."releaseDate" <= CURRENT_TIMESTAMP
          AND (
            movie."youtubeTrailerId" IS NOT NULL
            OR EXISTS (
              SELECT 1 FROM "trailers" trailer
              WHERE trailer."movieId" = movie."id"
                AND trailer."sourceType" = 'YOUTUBE'
                AND trailer."status" = 'ACTIVE'
            )
          )
      ), movie_codes AS (
        SELECT eligible."id" AS "movieId", 'country'::text AS "kind", country."isoCode" AS "code"
        FROM eligible_movies eligible
        JOIN "movie_countries" movie_country ON movie_country."movieId" = eligible."id"
        JOIN "countries" country ON country."id" = movie_country."countryId"
        UNION ALL
        SELECT eligible."id" AS "movieId", 'language'::text AS "kind", language."isoCode" AS "code"
        FROM eligible_movies eligible
        JOIN "movie_languages" movie_language ON movie_language."movieId" = eligible."id"
        JOIN "languages" language ON language."id" = movie_language."languageId"
      )
      SELECT filters."slug", COUNT(DISTINCT codes."movieId")::int AS "total"
      FROM origin_filters filters
      JOIN movie_codes codes ON (
        (codes."kind" = 'country' AND filters."countryCodes" ? codes."code")
        OR (codes."kind" = 'language' AND filters."languageCodes" ? codes."code")
      )
      GROUP BY filters."slug"
    `);
    return new Map(rows.map((row) => [row.slug, Number(row.total)]));
  }

  static async resolveCanonicalSlug(routeParam: string, db: DbClient = prisma) {
    const bySlug = await db.movie.findFirst({ where: { slug: routeParam, deletedAt: null }, select: { slug: true } });
    if (bySlug) return bySlug.slug;
    const byLegacyId = await db.movie.findFirst({ where: { id: routeParam, deletedAt: null }, select: { slug: true } });
    if (byLegacyId) return byLegacyId.slug;
    const suffix = routeParam.match(/-(\d+)$/);
    const tmdbId = suffix ? Number(suffix[1]) : NaN;
    if (!Number.isSafeInteger(tmdbId) || tmdbId <= 0) return null;
    const byTmdbId = await db.movie.findFirst({ where: { tmdbId, deletedAt: null }, select: { slug: true } });
    return byTmdbId?.slug || null;
  }

  static async listPublishedReleaseYears(db: DbClient = prisma) {
    const rows = await db.$queryRaw<Array<{ year: number }>>(Prisma.sql`
      SELECT DISTINCT EXTRACT(YEAR FROM "releaseDate")::int AS "year"
      FROM "movies"
      WHERE "status" = 'PUBLISHED'
        AND "deletedAt" IS NULL
        AND "releaseDate" IS NOT NULL
      ORDER BY "year" DESC
    `);

    return rows.map((row) => row.year);
  }

  static async listPublishedReleaseYearStats(db: DbClient = prisma) {
    return db.$queryRaw<Array<{ year: number; count: bigint; updatedAt: Date }>>(Prisma.sql`
      SELECT
        EXTRACT(YEAR FROM "releaseDate")::int AS "year",
        COUNT(*)::bigint AS "count",
        MAX("updatedAt") AS "updatedAt"
      FROM "movies"
      WHERE "status" = 'PUBLISHED'
        AND "deletedAt" IS NULL
        AND "releaseDate" IS NOT NULL
      GROUP BY EXTRACT(YEAR FROM "releaseDate")
      ORDER BY "year" DESC
    `);
  }

  static async findById(id: string, db: DbClient = prisma) {
    return db.movie.findFirst({
      where: { id, deletedAt: null },
      include: {
        genres: { include: { genre: true } },
        people: { include: { person: true } },
        trailers: true,
      },
    });
  }

  static async findBySlug(slug: string, db: DbClient = prisma) {
    return db.movie.findFirst({
      where: { slug, deletedAt: null },
      include: {
        genres: { include: { genre: true } },
        people: { include: { person: true }, orderBy: { sortOrder: 'asc' } },
        trailers: true,
        collections: { include: { collection: true } },
        tags: { include: { tag: true } },
        companies: { include: { company: true } },
        countries: { include: { country: true } },
        languages: { include: { language: true } },
        keywords: { include: { keyword: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        alternativeTitles: { take: 15 },
        watchProviderLinks: { include: { provider: true } },
        movieReviews: { orderBy: { createdAt: 'desc' }, take: 10 },
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

  static async list(
    params: {
      skip?: number;
      take?: number;
      search?: string;
      status?: import('@prisma/client').MovieStatus;
      orderBy?: { [key: string]: 'asc' | 'desc' };
      excludeId?: string;
    },
    db: DbClient = prisma
  ) {
    const where: Prisma.MovieWhereInput = { deletedAt: null };

    if (params.search) {
      where.title = { contains: params.search, mode: 'insensitive' };
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.excludeId) {
      where.id = { not: params.excludeId };
    }

    const [data, total] = await Promise.all([
      db.movie.findMany({
        skip: params.skip,
        take: params.take,
        where,
        orderBy: params.orderBy || { createdAt: 'desc' },
        include: {
          genres: { include: { genre: true } },
        },
      }),
      db.movie.count({ where }),
    ]);

    return { data, total };
  }

  static async search(
    params: {
      skip?: number;
      take?: number;
      search?: string;
      status?: import('@prisma/client').MovieStatus;
      orderBy?: Prisma.MovieOrderByWithRelationInput | Prisma.MovieOrderByWithRelationInput[];
      genreSlug?: string;
      genreIds?: string[];
      collectionSlug?: string;
      tagSlug?: string;
      excludeId?: string;
      countryCodes?: string[];
      languageCodes?: string[];
      releaseYear?: number;
      releaseDateLte?: Date;
    },
    db: DbClient = prisma
  ) {
    const where = buildCatalogWhere(params);

    const [data, total] = await Promise.all([
      db.movie.findMany({
        skip: params.skip,
        take: params.take,
        where,
        orderBy: params.orderBy || { createdAt: 'desc' },
        include: {
          genres: { include: { genre: true } },
        },
      }),
      db.movie.count({ where }),
    ]);

    return { data, total };
  }

  static async findRelatedCandidates(
    params: {
      excludeIds: string[];
      genreIds?: string[];
      take: number;
    },
    db: DbClient = prisma
  ): Promise<PublicMovieCardRecord[]> {
    const where: Prisma.MovieWhereInput = {
      deletedAt: null,
      status: 'PUBLISHED',
      id: params.excludeIds.length === 1
        ? { not: params.excludeIds[0] }
        : { notIn: params.excludeIds },
      ...(params.genreIds?.length
        ? { genres: { some: { genreId: { in: params.genreIds } } } }
        : {}),
    };

    return db.movie.findMany({
      take: params.take,
      where,
      orderBy: [
        { popularity: 'desc' },
        { releaseDate: 'desc' },
        { id: 'asc' },
      ],
      select: PUBLIC_MOVIE_CARD_SELECT,
    });
  }

  static async searchPublicCards(
    params: {
      skip?: number;
      take?: number;
      orderBy?: Prisma.MovieOrderByWithRelationInput | Prisma.MovieOrderByWithRelationInput[];
      genreSlug?: string;
      collectionSlug?: string;
      tagSlug?: string;
      countryCodes?: string[];
      languageCodes?: string[];
      releaseYear?: number;
      releaseDateLte?: Date;
    },
    db: DbClient = prisma
  ): Promise<{ data: PublicMovieCardRecord[]; total: number }> {
    const where = buildCatalogWhere({ ...params, status: 'PUBLISHED' });

    const [data, total] = await Promise.all([
      db.movie.findMany({
        skip: params.skip,
        take: params.take,
        where,
        orderBy: params.orderBy || [{ releaseDate: 'desc' }, { popularity: 'desc' }, { id: 'asc' }],
        select: PUBLIC_MOVIE_CARD_SELECT,
      }),
      db.movie.count({ where }),
    ]);

    return { data, total };
  }

  static async getCatalogStats(filters: CatalogFilters, db: DbClient = prisma) {
    const rows = await db.$queryRaw<Array<{
      total: number; earliestYear: number | null; latestYear: number | null;
      dominantGenres: Array<{ name: string; count: number }>;
      highlights: Array<{ title: string; slug: string; voteAverage: number | null }>;
    }>>(catalogStatsQuery(filters));
    return rows[0] || { total: 0, earliestYear: null, latestYear: null, dominantGenres: [], highlights: [] };
  }

  static async searchTopRated(
    params: { skip: number; take: number; minimumVotes?: number },
    db: DbClient = prisma
  ) {
    const minimumVotes = Math.max(1, params.minimumVotes || 50);
    const rows = await db.$queryRaw<Array<{ id: string; total: bigint }>>(Prisma.sql`
      WITH eligible AS (
        SELECT "id", "voteAverage", "voteCount",
          AVG("voteAverage") OVER () AS catalog_mean
        FROM "movies"
        WHERE "status" = 'PUBLISHED'
          AND "deletedAt" IS NULL
          AND "voteAverage" IS NOT NULL
          AND "voteCount" >= ${minimumVotes}
      )
      SELECT "id", COUNT(*) OVER ()::bigint AS "total"
      FROM eligible
      ORDER BY
        (("voteCount"::float / ("voteCount" + ${minimumVotes})) * "voteAverage")
        + ((${minimumVotes}::float / ("voteCount" + ${minimumVotes})) * catalog_mean) DESC,
        "voteCount" DESC,
        "id" ASC
      OFFSET ${Math.max(0, params.skip)}
      LIMIT ${Math.max(1, params.take)}
    `);

    const ids = rows.map((row) => row.id);
    const movies = ids.length
      ? await db.movie.findMany({
          where: { id: { in: ids } },
          include: { genres: { include: { genre: true } } },
        })
      : [];
    const byId = new Map(movies.map((movie) => [movie.id, movie]));
    return {
      data: ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : [])),
      total: Number(rows[0]?.total || 0),
    };
  }
}
