import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from './base.types';
import { catalogStatsQuery } from '../catalog-stats-query';
import {
  MOVIES_LIKE_DISPLAY_LIMIT,
  MOVIES_LIKE_MIN_RECOMMENDATIONS,
  MOVIES_LIKE_MIN_VOTES,
} from '../movies-like';

export interface CatalogFilters {
  search?: string;
  status?: import('@prisma/client').MovieStatus;
  genreSlug?: string;
  genreIds?: string[];
  collectionSlug?: string;
  tagSlug?: string;
  providerTmdbIds?: number[];
  excludeId?: string;
  countryCodes?: string[];
  languageCodes?: string[];
  releaseYear?: number;
  releaseDateLte?: Date;
  latestReleasesOnly?: boolean;
  minimumVotes?: number;
  minRuntimeMinutes?: number;
  maxRuntimeMinutes?: number;
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

const SEARCH_STOP_WORDS = new Set([
  'the', 'a', 'an', 'of', 'in', 'to', 'for', 'and', 'or', 'on', 'at', 'by', 'with', 'as', 'is',
]);

export function extractSearchTerms(rawSearch: string): string[] {
  const allTerms = rawSearch.trim().split(/\s+/).filter(Boolean).slice(0, 8);
  const significant = allTerms.filter(
    (term) => term.length >= 2 && !SEARCH_STOP_WORDS.has(term.toLowerCase()),
  );
  return significant.length > 0 ? significant : allTerms;
}

function buildCatalogWhere(params: CatalogFilters): Prisma.MovieWhereInput {
  const where: Prisma.MovieWhereInput = { deletedAt: null };
  const andFilters: Prisma.MovieWhereInput[] = [];

  if (params.search) {
    const terms = extractSearchTerms(params.search);
    for (const term of terms) {
      // For 1-2 character terms (e.g. "F1", "IT", "Up", "65"), ILIKE '%IT%' has
      // zero 3-char trigrams and would scan the entire table. Using startsWith
      // ('IT%') + word-boundary ('% IT%') provides 3-char padded trigrams ('  i', ' it')
      // so PostgreSQL uses the pg_trgm GIN index in <5ms.
      if (term.length < 3) {
        andFilters.push({
          OR: [
            { title: { startsWith: term, mode: 'insensitive' as const } },
            { title: { contains: ` ${term}`, mode: 'insensitive' as const } },
            { originalTitle: { startsWith: term, mode: 'insensitive' as const } },
            { originalTitle: { contains: ` ${term}`, mode: 'insensitive' as const } },
          ],
        });
      } else {
        andFilters.push({
          OR: [
            { title: { contains: term, mode: 'insensitive' as const } },
            { originalTitle: { contains: term, mode: 'insensitive' as const } },
          ],
        });
      }
    }
  }
  if (params.status) where.status = params.status;
  if (params.excludeId) where.id = { not: params.excludeId };
  if (params.genreIds?.length) where.genres = { some: { genreId: { in: params.genreIds } } };
  else if (params.genreSlug) where.genres = { some: { genre: { slug: params.genreSlug } } };
  if (params.collectionSlug) where.collections = { some: { collection: { slug: params.collectionSlug } } };
  if (params.tagSlug) where.tags = { some: { tag: { slug: params.tagSlug } } };
  if (params.providerTmdbIds?.length) {
    where.watchProviderLinks = {
      some: { provider: { tmdbId: { in: params.providerTmdbIds } } },
    };
  }

  const originFilters: Prisma.MovieWhereInput[] = [];
  if (params.countryCodes?.length) originFilters.push({ countries: { some: { country: { isoCode: { in: params.countryCodes } } } } });
  if (params.languageCodes?.length) originFilters.push({ languages: { some: { language: { isoCode: { in: params.languageCodes } } } } });
  if (originFilters.length) andFilters.push({ OR: originFilters });
  if (params.releaseYear) andFilters.push({ releaseDate: { gte: new Date(Date.UTC(params.releaseYear, 0, 1)), lt: new Date(Date.UTC(params.releaseYear + 1, 0, 1)) } });
  if (params.latestReleasesOnly) andFilters.push({ releaseDate: { not: null, lte: new Date() } });
  else if (params.releaseDateLte) andFilters.push({ releaseDate: { lte: params.releaseDateLte } });
  if (params.minimumVotes) andFilters.push({ voteCount: { gte: params.minimumVotes } });
  if (params.minRuntimeMinutes !== undefined || params.maxRuntimeMinutes !== undefined) {
    andFilters.push({
      runtimeMinutes: {
        ...(params.minRuntimeMinutes !== undefined ? { gte: params.minRuntimeMinutes } : {}),
        ...(params.maxRuntimeMinutes !== undefined ? { lte: params.maxRuntimeMinutes } : {}),
      },
    });
  }
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
      WITH origin_code_map AS (
        SELECT item."slug", 'country'::text AS "kind", code::text AS "code"
        FROM jsonb_to_recordset(${payload}::jsonb)
          AS item("slug" text, "countryCodes" jsonb, "languageCodes" jsonb)
        CROSS JOIN LATERAL jsonb_array_elements_text(item."countryCodes") AS code
        UNION ALL
        SELECT item."slug", 'language'::text AS "kind", code::text AS "code"
        FROM jsonb_to_recordset(${payload}::jsonb)
          AS item("slug" text, "countryCodes" jsonb, "languageCodes" jsonb)
        CROSS JOIN LATERAL jsonb_array_elements_text(item."languageCodes") AS code
      ),
      matched_movies AS (
        SELECT ocm."slug", mc."movieId"
        FROM origin_code_map ocm
        JOIN "countries" c ON ocm."kind" = 'country' AND c."isoCode" = ocm."code"
        JOIN "movie_countries" mc ON mc."countryId" = c."id"
        UNION
        SELECT ocm."slug", ml."movieId"
        FROM origin_code_map ocm
        JOIN "languages" l ON ocm."kind" = 'language' AND l."isoCode" = ocm."code"
        JOIN "movie_languages" ml ON ml."languageId" = l."id"
      )
      SELECT mm."slug", COUNT(*)::int AS "total"
      FROM matched_movies mm
      JOIN "movies" movie ON movie."id" = mm."movieId"
      WHERE movie."status" = 'PUBLISHED'
        AND movie."deletedAt" IS NULL
      GROUP BY mm."slug"
    `);
    return new Map(rows.map((row) => [row.slug, Number(row.total)]));
  }

  static async countStreamingGroups(
    platforms: Array<{ slug: string; tmdbIds: number[] }>,
    db: DbClient = prisma,
  ) {
    if (!platforms.length) return new Map<string, number>();
    const allTmdbIds = [...new Set(platforms.flatMap((p) => p.tmdbIds))];
    if (!allTmdbIds.length) return new Map<string, number>();
    const payload = JSON.stringify(platforms);
    const rows = await db.$queryRaw<Array<{ slug: string; total: number }>>(Prisma.sql`
      WITH platform_filters AS (
        SELECT "slug", jsonb_array_elements_text("tmdbIds")::int AS "tmdbId"
        FROM jsonb_to_recordset(${payload}::jsonb)
          AS item("slug" text, "tmdbIds" jsonb)
      ),
      distinct_provider_movies AS MATERIALIZED (
        SELECT wp."tmdbId", d."movieId"
        FROM "watch_providers" wp
        CROSS JOIN LATERAL (
          SELECT DISTINCT mwpl."movieId"
          FROM "movie_watch_provider_links" mwpl
          WHERE mwpl."providerId" = wp."id"
        ) d
        WHERE wp."tmdbId" IN (${Prisma.join(allTmdbIds)})
      ),
      published_movies AS MATERIALIZED (
        SELECT m."id"
        FROM "movies" m
        WHERE m."status" = 'PUBLISHED' AND m."deletedAt" IS NULL
      )
      SELECT pf."slug", COUNT(DISTINCT dpm."movieId")::int AS "total"
      FROM distinct_provider_movies dpm
      JOIN published_movies pm ON pm."id" = dpm."movieId"
      JOIN platform_filters pf ON pf."tmdbId" = dpm."tmdbId"
      GROUP BY pf."slug"
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
        people: {
          include: {
            person: {
              select: {
                id: true,
                name: true,
                slug: true,
                headshotUrl: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        trailers: true,
        collections: {
          where: {
            collection: {
              isActive: true,
              slug: { not: '' },
            },
          },
          include: { collection: true },
        },
        tags: { include: { tag: true } },
        companies: { include: { company: true } },
        countries: { include: { country: true } },
        languages: { include: { language: true } },
        keywords: { include: { keyword: true } },
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 24,
          select: {
            id: true,
            imageUrl: true,
            imageType: true,
            aspectRatio: true,
            width: true,
            height: true,
            voteAverage: true,
          },
        },
        alternativeTitles: { take: 15, select: { id: true, title: true } },
        watchProviderLinks: {
          select: {
            countryCode: true,
            accessType: true,
            provider: {
              select: {
                id: true,
                tmdbId: true,
                name: true,
                logoUrl: true,
                displayPriority: true,
              },
            },
          },
        },
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
  ): Promise<{ data: PublicMovieCardRecord[]; total: number }> {
    const where = buildCatalogWhere(params);
    const defaultOrder: Prisma.MovieOrderByWithRelationInput[] = params.search
      ? [{ popularity: 'desc' }, { releaseDate: 'desc' }, { id: 'asc' }]
      : [{ createdAt: 'desc' }, { id: 'asc' }];

    const [data, total] = await Promise.all([
      db.movie.findMany({
        skip: params.skip,
        take: params.take,
        where,
        orderBy: params.orderBy || defaultOrder,
        select: PUBLIC_MOVIE_CARD_SELECT,
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
      providerTmdbIds?: number[];
      countryCodes?: string[];
      languageCodes?: string[];
      releaseYear?: number;
      releaseDateLte?: Date;
      minRuntimeMinutes?: number;
      maxRuntimeMinutes?: number;
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

  static async listIndexableFacetGuides(
    params: {
      platforms: Array<{ slug: string; tmdbIds: number[] }>;
      origins: Array<{ slug: string; countryCodes: string[]; languageCodes: string[] }>;
      minCount?: number;
    },
    db: DbClient = prisma,
  ) {
    const minCount = Math.max(3, params.minCount ?? 10);
    const platformsJson = JSON.stringify(params.platforms);
    const originsJson = JSON.stringify(params.origins);

    // Run sequentially so facet-guide aggregation never consumes more than 1 DB pool slot at a time.
    const allPlatformTmdbIds = [...new Set(params.platforms.flatMap((p) => p.tmdbIds))];
    const streamingGenre = allPlatformTmdbIds.length
      ? await db.$queryRaw<Array<{ streamingSlug: string; genreSlug: string; count: number }>>(Prisma.sql`
          WITH platform_filters AS (
            SELECT "slug", jsonb_array_elements_text("tmdbIds")::int AS "tmdbId"
            FROM jsonb_to_recordset(${platformsJson}::jsonb)
              AS item("slug" text, "tmdbIds" jsonb)
          ),
          distinct_provider_movies AS MATERIALIZED (
            SELECT wp."tmdbId", d."movieId"
            FROM "watch_providers" wp
            CROSS JOIN LATERAL (
              SELECT DISTINCT mwpl."movieId"
              FROM "movie_watch_provider_links" mwpl
              WHERE mwpl."providerId" = wp."id"
            ) d
            WHERE wp."tmdbId" IN (${Prisma.join(allPlatformTmdbIds)})
          ),
          published_movies AS MATERIALIZED (
            SELECT m."id"
            FROM "movies" m
            WHERE m."status" = 'PUBLISHED' AND m."deletedAt" IS NULL
          ),
          movie_platform AS (
            SELECT DISTINCT pf."slug" AS "streamingSlug", dpm."movieId"
            FROM distinct_provider_movies dpm
            JOIN published_movies pm ON pm."id" = dpm."movieId"
            JOIN platform_filters pf ON pf."tmdbId" = dpm."tmdbId"
          )
          SELECT mp."streamingSlug", g."slug" AS "genreSlug", COUNT(*)::int AS "count"
          FROM movie_platform mp
          JOIN "movie_genres" mg ON mg."movieId" = mp."movieId"
          JOIN "genres" g ON g."id" = mg."genreId"
          WHERE g."description" IS NOT NULL AND BTRIM(g."description") <> ''
          GROUP BY mp."streamingSlug", g."slug"
          HAVING COUNT(*) >= ${minCount}
          ORDER BY "count" DESC, mp."streamingSlug" ASC, g."slug" ASC
        `)
      : [];

    const genreYear = await db.$queryRaw<Array<{ genreSlug: string; year: number; count: number }>>(Prisma.sql`
      SELECT
        g."slug" AS "genreSlug",
        EXTRACT(YEAR FROM m."releaseDate")::int AS "year",
        COUNT(DISTINCT m."id")::int AS "count"
      FROM "movies" m
      JOIN "movie_genres" mg ON mg."movieId" = m."id"
      JOIN "genres" g ON g."id" = mg."genreId"
      WHERE m."status" = 'PUBLISHED'
        AND m."deletedAt" IS NULL
        AND m."releaseDate" IS NOT NULL
        AND g."description" IS NOT NULL
        AND BTRIM(g."description") <> ''
      GROUP BY g."slug", EXTRACT(YEAR FROM m."releaseDate")::int
      HAVING COUNT(DISTINCT m."id") >= ${minCount}
      ORDER BY "year" DESC, "count" DESC, g."slug" ASC
    `);

    const originGenre = params.origins.length
      ? await db.$queryRaw<Array<{ originSlug: string; genreSlug: string; count: number }>>(Prisma.sql`
          WITH origin_code_map AS (
            SELECT item."slug" AS "originSlug", 'country'::text AS "kind", code::text AS "code"
            FROM jsonb_to_recordset(${originsJson}::jsonb)
              AS item("slug" text, "countryCodes" jsonb, "languageCodes" jsonb)
            CROSS JOIN LATERAL jsonb_array_elements_text(item."countryCodes") AS code
            UNION ALL
            SELECT item."slug" AS "originSlug", 'language'::text AS "kind", code::text AS "code"
            FROM jsonb_to_recordset(${originsJson}::jsonb)
              AS item("slug" text, "countryCodes" jsonb, "languageCodes" jsonb)
            CROSS JOIN LATERAL jsonb_array_elements_text(item."languageCodes") AS code
          ),
          matched_countries AS (
            SELECT ocm."originSlug", mc."movieId"
            FROM origin_code_map ocm
            JOIN "countries" c ON ocm."kind" = 'country' AND c."isoCode" = ocm."code"
            JOIN "movie_countries" mc ON mc."countryId" = c."id"
          ),
          matched_languages AS (
            SELECT ocm."originSlug", ml."movieId"
            FROM origin_code_map ocm
            JOIN "languages" l ON ocm."kind" = 'language' AND l."isoCode" = ocm."code"
            JOIN "movie_languages" ml ON ml."languageId" = l."id"
          ),
          origin_movies AS (
            SELECT "originSlug", "movieId" FROM matched_countries
            UNION
            SELECT "originSlug", "movieId" FROM matched_languages
          )
          SELECT om."originSlug", g."slug" AS "genreSlug", COUNT(*)::int AS "count"
          FROM origin_movies om
          JOIN "movies" m ON m."id" = om."movieId"
          JOIN "movie_genres" mg ON mg."movieId" = m."id"
          JOIN "genres" g ON g."id" = mg."genreId"
          WHERE m."status" = 'PUBLISHED'
            AND m."deletedAt" IS NULL
            AND g."description" IS NOT NULL
            AND BTRIM(g."description") <> ''
          GROUP BY om."originSlug", g."slug"
          HAVING COUNT(*) >= ${minCount}
          ORDER BY "count" DESC, om."originSlug" ASC, g."slug" ASC
        `)
      : [];

    return {
      streamingGenre: streamingGenre.map((row) => ({
        streamingSlug: row.streamingSlug,
        genreSlug: row.genreSlug,
        count: Number(row.count),
      })),
      genreYear: genreYear.map((row) => ({
        genreSlug: row.genreSlug,
        year: Number(row.year),
        count: Number(row.count),
      })),
      originGenre: originGenre.map((row) => ({
        originSlug: row.originSlug,
        genreSlug: row.genreSlug,
        count: Number(row.count),
      })),
    };
  }

  static async countPublishedDirectRecommendations(movieId: string, db: DbClient = prisma) {
    return db.movieRecommendation.count({
      where: {
        sourceMovieId: movieId,
        targetMovie: { status: 'PUBLISHED', deletedAt: null },
      },
    });
  }

  static async findSimilarMoviesGuideBySlug(slug: string, db: DbClient = prisma) {
    const movie = await db.movie.findFirst({
      where: { slug, status: 'PUBLISHED', deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        synopsis: true,
        posterUrl: true,
        backdropUrl: true,
        releaseDate: true,
        runtimeMinutes: true,
        mpaaRating: true,
        voteAverage: true,
        voteCount: true,
        updatedAt: true,
        importQualityStatus: true,
        genres: {
          select: {
            genre: { select: { id: true, name: true, slug: true } },
          },
        },
        keywords: {
          take: 20,
          select: {
            keyword: { select: { name: true } },
          },
        },
        people: {
          where: { roleType: 'DIRECTOR' },
          take: 3,
          select: {
            person: { select: { name: true } },
          },
        },
      },
    });
    if (!movie) return null;

    const recs = await db.movieRecommendation.findMany({
      where: {
        sourceMovieId: movie.id,
        targetMovie: { status: 'PUBLISHED', deletedAt: null },
      },
      orderBy: [{ sortOrder: 'asc' }, { score: 'desc' }],
      take: MOVIES_LIKE_DISPLAY_LIMIT,
      select: {
        targetMovie: {
          select: {
            id: true,
            title: true,
            slug: true,
            posterUrl: true,
            backdropUrl: true,
            synopsis: true,
            releaseDate: true,
            runtimeMinutes: true,
            mpaaRating: true,
            voteAverage: true,
            voteCount: true,
            watchProviders: true,
            genres: {
              select: {
                genre: { select: { name: true, slug: true } },
              },
            },
            keywords: {
              take: 15,
              select: {
                keyword: { select: { name: true } },
              },
            },
            people: {
              where: { roleType: 'DIRECTOR' },
              take: 2,
              select: {
                person: { select: { name: true } },
              },
            },
            watchProviderLinks: {
              take: 12,
              select: {
                provider: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    return {
      movie,
      recommendations: recs.map((r) => r.targetMovie),
    };
  }

  static async countIndexableMoviesLike(db: DbClient = prisma) {
    const rows = await db.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS "count"
      FROM (
        SELECT mr."sourceMovieId"
        FROM "movie_recommendations" mr
        JOIN "movies" src ON src."id" = mr."sourceMovieId"
        JOIN "movies" tgt ON tgt."id" = mr."targetMovieId"
        WHERE src."status" = 'PUBLISHED'
          AND src."deletedAt" IS NULL
          AND src."importQualityStatus" = 'READY'
          AND COALESCE(src."voteCount", 0) >= ${MOVIES_LIKE_MIN_VOTES}
          AND tgt."status" = 'PUBLISHED'
          AND tgt."deletedAt" IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM "seo_pages" s
            WHERE s."seoableType" = 'Movie' AND s."seoableId" = src."id" AND (s."isNoindex" OR NOT s."inSitemap")
          )
        GROUP BY mr."sourceMovieId"
        HAVING COUNT(DISTINCT mr."targetMovieId") >= ${MOVIES_LIKE_MIN_RECOMMENDATIONS}
      ) eligible
    `);
    return Number(rows[0]?.count || 0);
  }

  static async listIndexableMoviesLikeForSitemap(
    params: { skip?: number; take?: number } = {},
    db: DbClient = prisma,
  ) {
    const skip = Math.max(0, params.skip || 0);
    const take = Math.min(10_000, Math.max(1, params.take || 10_000));
    return db.$queryRaw<Array<{ slug: string; title: string; posterUrl: string | null; updatedAt: Date }>>(Prisma.sql`
      SELECT src."slug", src."title", src."posterUrl", src."updatedAt"
      FROM "movie_recommendations" mr
      JOIN "movies" src ON src."id" = mr."sourceMovieId"
      JOIN "movies" tgt ON tgt."id" = mr."targetMovieId"
      WHERE src."status" = 'PUBLISHED'
        AND src."deletedAt" IS NULL
        AND src."importQualityStatus" = 'READY'
        AND COALESCE(src."voteCount", 0) >= ${MOVIES_LIKE_MIN_VOTES}
        AND tgt."status" = 'PUBLISHED'
        AND tgt."deletedAt" IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM "seo_pages" s
          WHERE s."seoableType" = 'Movie' AND s."seoableId" = src."id" AND (s."isNoindex" OR NOT s."inSitemap")
        )
      GROUP BY src."id", src."slug", src."title", src."posterUrl", src."updatedAt", src."popularity"
      HAVING COUNT(DISTINCT mr."targetMovieId") >= ${MOVIES_LIKE_MIN_RECOMMENDATIONS}
      ORDER BY COALESCE(src."popularity", 0) DESC, src."id" ASC
      OFFSET ${skip}
      LIMIT ${take}
    `);
  }
}
