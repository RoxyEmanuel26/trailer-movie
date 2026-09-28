CREATE INDEX "idx_movies_sitemap"
ON "movies"("status", "deletedAt", "importQualityStatus", "slug", "id");
