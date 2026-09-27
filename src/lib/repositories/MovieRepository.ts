import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from './base.types';

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

  static async getCatalogStats(filters: CatalogFilters, db: DbClient = prisma) {
    const where = buildCatalogWhere({ ...filters, status: 'PUBLISHED' });
    const [summary, genreGroups, highlights] = await Promise.all([
      db.movie.aggregate({
        where,
        _count: { _all: true },
        _min: { releaseDate: true },
        _max: { releaseDate: true },
      }),
      db.movieGenre.groupBy({
        by: ['genreId'],
        where: { movie: where },
        _count: { genreId: true },
        orderBy: { _count: { genreId: 'desc' } },
        take: 3,
      }),
      db.movie.findMany({
        where,
        orderBy: [{ popularity: 'desc' }, { voteAverage: 'desc' }, { id: 'asc' }],
        take: 3,
        select: { title: true, slug: true, voteAverage: true },
      }),
    ]);
    const genres = genreGroups.length
      ? await db.genre.findMany({ where: { id: { in: genreGroups.map((group) => group.genreId) } }, select: { id: true, name: true } })
      : [];
    const genreNames = new Map(genres.map((genre) => [genre.id, genre.name]));
    return {
      total: summary._count._all,
      earliestYear: summary._min.releaseDate?.getUTCFullYear() || null,
      latestYear: summary._max.releaseDate?.getUTCFullYear() || null,
      dominantGenres: genreGroups.flatMap((group) => genreNames.has(group.genreId) ? [{ name: genreNames.get(group.genreId)!, count: group._count.genreId }] : []),
      highlights,
    };
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
