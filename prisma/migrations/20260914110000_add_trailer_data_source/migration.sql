ALTER TABLE "trailers"
ADD COLUMN "dataSource" "DataSource" NOT NULL DEFAULT 'MANUAL';

UPDATE "trailers"
SET "dataSource" = 'TMDB'
WHERE "sourceType" = 'YOUTUBE'
  AND "thumbnailUrl" LIKE 'https://img.youtube.com/vi/%';

CREATE INDEX "trailers_movieId_dataSource_idx"
ON "trailers"("movieId", "dataSource");
