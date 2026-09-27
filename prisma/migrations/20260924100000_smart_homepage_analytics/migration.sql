-- Additive foundations for deterministic homepage sections and consented,
-- de-duplicated engagement analytics. Existing events remain untouched.
ALTER TABLE "homepage_sections"
  ADD COLUMN "systemKey" TEXT,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "analytics_events"
  ADD COLUMN "dedupeKey" TEXT;

CREATE UNIQUE INDEX "homepage_sections_systemKey_key"
  ON "homepage_sections"("systemKey");

CREATE UNIQUE INDEX "analytics_events_dedupeKey_key"
  ON "analytics_events"("dedupeKey");

CREATE INDEX "analytics_events_eventName_entityId_createdAt_idx"
  ON "analytics_events"("eventName", "entityId", "createdAt");

CREATE INDEX "daily_metrics_metric_entityType_date_entityId_idx"
  ON "daily_metrics"("metric", "entityType", "date", "entityId");

CREATE INDEX "movies_status_deletedAt_importQualityStatus_releaseDate_idx"
  ON "movies"("status", "deletedAt", "importQualityStatus", "releaseDate");

CREATE INDEX "movies_status_deletedAt_importQualityStatus_popularity_idx"
  ON "movies"("status", "deletedAt", "importQualityStatus", "popularity");
