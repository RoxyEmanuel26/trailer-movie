-- Covering and partial indexes for public movie detail recommendations and catalog routes.
-- Created with IF NOT EXISTS so pre-built CONCURRENTLY production indexes pass cleanly.

CREATE INDEX IF NOT EXISTS "movies_public_created_idx"
ON "movies" ("createdAt" DESC, "id" ASC)
WHERE "status" = 'PUBLISHED' AND "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "movies_public_release_nulls_last_idx"
ON "movies" ("releaseDate" DESC NULLS LAST, "popularity" DESC, "createdAt" DESC, "id" ASC)
WHERE "status" = 'PUBLISHED' AND "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "movies_public_release_desc_idx"
ON "movies" ("releaseDate" DESC, "popularity" DESC, "id" ASC)
WHERE "status" = 'PUBLISHED' AND "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "movies_public_popularity_desc_idx"
ON "movies" ("popularity" DESC, "releaseDate" DESC, "id" ASC)
INCLUDE ("voteAverage")
WHERE "status" = 'PUBLISHED' AND "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "movies_public_top_rated_idx"
ON "movies" ("voteCount" DESC, "id" ASC)
INCLUDE ("voteAverage")
WHERE "status" = 'PUBLISHED' AND "deletedAt" IS NULL AND "voteAverage" IS NOT NULL AND "voteCount" >= 50;

CREATE INDEX IF NOT EXISTS "movie_genres_genre_movie_idx"
ON "movie_genres" ("genreId", "movieId");

CREATE INDEX IF NOT EXISTS "movie_countries_country_movie_idx"
ON "movie_countries" ("countryId", "movieId");

CREATE INDEX IF NOT EXISTS "movie_languages_language_movie_idx"
ON "movie_languages" ("languageId", "movieId");

CREATE INDEX IF NOT EXISTS "movie_tags_tag_movie_idx"
ON "movie_tags" ("tagId", "movieId");
