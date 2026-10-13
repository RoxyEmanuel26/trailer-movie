-- Cover the published hub counters without reading large movie rows from disk.
-- Literal predicates in getPopularHubCounts match this partial index exactly.
-- SQL-only covering/partial index; keep outside a transaction for CONCURRENTLY.
CREATE INDEX CONCURRENTLY "movies_public_hub_counts_idx"
ON "movies" ("releaseDate") INCLUDE ("voteAverage", "voteCount")
WHERE "status" = 'PUBLISHED' AND "deletedAt" IS NULL;
