-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "HomepageSectionType" ADD VALUE 'AUTO_TRENDING';
ALTER TYPE "HomepageSectionType" ADD VALUE 'GENRE_BASED';

-- DropIndex
DROP INDEX "movies_originalTitle_gin_idx";

-- DropIndex
DROP INDEX "movies_synopsis_gin_idx";

-- DropIndex
DROP INDEX "movies_title_gin_idx";

-- AlterTable
ALTER TABLE "collections" ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "homepage_sections" ADD COLUMN     "genreId" TEXT;

-- AlterTable
ALTER TABLE "movies" ADD COLUMN     "youtubeTrailerId" TEXT;

-- CreateTable
CREATE TABLE "daily_metrics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "metric" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_metrics_date_metric_idx" ON "daily_metrics"("date", "metric");

-- CreateIndex
CREATE UNIQUE INDEX "daily_metrics_date_metric_entityType_entityId_key" ON "daily_metrics"("date", "metric", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "analytics_events_eventName_createdAt_idx" ON "analytics_events"("eventName", "createdAt");

-- CreateIndex
CREATE INDEX "search_logs_createdAt_idx" ON "search_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "homepage_sections" ADD CONSTRAINT "homepage_sections_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "genres"("id") ON DELETE SET NULL ON UPDATE CASCADE;
