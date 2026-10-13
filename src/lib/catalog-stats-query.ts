import { Prisma } from '@prisma/client';
import type { CatalogFilters } from './repositories/MovieRepository';

/** Literal public predicate lets PostgreSQL use the partial public indexes. */
export function catalogStatsQuery(filters: CatalogFilters) {
  const conditions = [Prisma.sql`m."status" = 'PUBLISHED' AND m."deletedAt" IS NULL`];
  if (filters.excludeId) conditions.push(Prisma.sql`m."id" <> ${filters.excludeId}`);
  if (filters.genreIds?.length) {
    conditions.push(Prisma.sql`EXISTS (SELECT 1 FROM "movie_genres" mg WHERE mg."movieId" = m."id" AND mg."genreId" IN (${Prisma.join(filters.genreIds)}))`);
  } else if (filters.genreSlug) {
    conditions.push(Prisma.sql`EXISTS (SELECT 1 FROM "movie_genres" mg JOIN "genres" g ON g."id" = mg."genreId" WHERE mg."movieId" = m."id" AND g."slug" = ${filters.genreSlug})`);
  }
  if (filters.collectionSlug) conditions.push(Prisma.sql`EXISTS (SELECT 1 FROM "collection_movies" cm JOIN "collections" c ON c."id" = cm."collectionId" WHERE cm."movieId" = m."id" AND c."slug" = ${filters.collectionSlug})`);
  if (filters.tagSlug) conditions.push(Prisma.sql`EXISTS (SELECT 1 FROM "movie_tags" mt JOIN "tags" t ON t."id" = mt."tagId" WHERE mt."movieId" = m."id" AND t."slug" = ${filters.tagSlug})`);
  const origins: Prisma.Sql[] = [];
  if (filters.countryCodes?.length) origins.push(Prisma.sql`EXISTS (SELECT 1 FROM "movie_countries" mc JOIN "countries" c ON c."id" = mc."countryId" WHERE mc."movieId" = m."id" AND c."isoCode" IN (${Prisma.join(filters.countryCodes)}))`);
  if (filters.languageCodes?.length) origins.push(Prisma.sql`EXISTS (SELECT 1 FROM "movie_languages" ml JOIN "languages" l ON l."id" = ml."languageId" WHERE ml."movieId" = m."id" AND l."isoCode" IN (${Prisma.join(filters.languageCodes)}))`);
  if (origins.length) conditions.push(Prisma.sql`(${Prisma.join(origins, ' OR ')})`);
  if (filters.releaseYear) conditions.push(Prisma.sql`m."releaseDate" >= ${new Date(Date.UTC(filters.releaseYear, 0, 1))} AND m."releaseDate" < ${new Date(Date.UTC(filters.releaseYear + 1, 0, 1))}`);
  if (filters.releaseDateLte) conditions.push(Prisma.sql`m."releaseDate" <= ${filters.releaseDateLte}`);
  if (filters.minimumVotes) conditions.push(Prisma.sql`m."voteCount" >= ${filters.minimumVotes}`);
  const terms = filters.search?.trim().split(/\s+/).filter(Boolean).slice(0, 8) || [];
  if (terms.length) conditions.push(Prisma.sql`(${Prisma.join(terms.map((term) => {
    // Match Prisma contains literally, including SQL wildcard characters.
    const pattern = `%${term.replace(/[\\%_]/g, '\\$&')}%`;
    return Prisma.sql`(m."title" ILIKE ${pattern} OR m."synopsis" ILIKE ${pattern})`;
  }), ' OR ')})`);

  return Prisma.sql`
    WITH eligible AS NOT MATERIALIZED (
      SELECT m."id", m."releaseDate", m."popularity", m."voteAverage"
      FROM "movies" m WHERE ${Prisma.join(conditions, ' AND ')}
    ), genre_counts AS (
      SELECT g."name", COUNT(*)::int AS "count"
      FROM eligible e JOIN "movie_genres" mg ON mg."movieId" = e."id"
      JOIN "genres" g ON g."id" = mg."genreId"
      GROUP BY g."id", g."name" ORDER BY COUNT(*) DESC, g."name" ASC LIMIT 3
    ), top_movies AS (
      SELECT m."title", m."slug", m."voteAverage"
      FROM eligible e JOIN "movies" m ON m."id" = e."id"
      ORDER BY e."popularity" DESC, e."voteAverage" DESC, e."id" ASC LIMIT 3
    )
    SELECT COUNT(*)::int AS "total",
      EXTRACT(YEAR FROM MIN(e."releaseDate"))::int AS "earliestYear",
      EXTRACT(YEAR FROM MAX(e."releaseDate"))::int AS "latestYear",
      COALESCE((SELECT jsonb_agg(row_to_json(g)) FROM genre_counts g), '[]'::jsonb) AS "dominantGenres",
      COALESCE((SELECT jsonb_agg(row_to_json(t)) FROM top_movies t), '[]'::jsonb) AS "highlights"
    FROM eligible e
  `;
}
