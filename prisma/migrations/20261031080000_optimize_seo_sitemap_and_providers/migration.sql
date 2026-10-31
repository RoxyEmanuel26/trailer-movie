-- Chronological append-only movie sitemap index, indexable person headshot partial index,
-- and composite streaming provider index for /streaming and /streaming/[slug] hubs.
-- Created with IF NOT EXISTS so pre-built CONCURRENTLY production indexes pass cleanly.

CREATE INDEX IF NOT EXISTS "idx_movies_sitemap_chronological"
ON "movies" ("createdAt" ASC, "id" ASC)
WHERE "status" = 'PUBLISHED' AND "deletedAt" IS NULL AND "importQualityStatus" = 'READY';

CREATE INDEX IF NOT EXISTS "idx_people_sitemap_headshot"
ON "people" ("slug" ASC, "id" ASC)
INCLUDE ("updatedAt")
WHERE "headshotUrl" IS NOT NULL AND BTRIM("headshotUrl") <> '';

CREATE INDEX IF NOT EXISTS "idx_watch_provider_links_provider_movie"
ON "movie_watch_provider_links" ("providerId", "movieId");
