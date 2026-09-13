ALTER TYPE "ImportJobStatus" ADD VALUE IF NOT EXISTS 'PARTIAL';

CREATE TYPE "ImportBatchStatus" AS ENUM ('PENDING', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED');
CREATE TYPE "MovieQualityStatus" AS ENUM ('READY', 'INCOMPLETE', 'NEEDS_REVIEW');

ALTER TABLE "movies"
  ADD COLUMN "tmdbSyncedAt" TIMESTAMP(3),
  ADD COLUMN "importQualityStatus" "MovieQualityStatus" NOT NULL DEFAULT 'NEEDS_REVIEW',
  ADD COLUMN "importQualityIssues" JSONB DEFAULT '[]';

ALTER TABLE "people"
  ADD COLUMN "tmdbSyncedAt" TIMESTAMP(3);

ALTER TABLE "import_jobs"
  ADD COLUMN "stage" TEXT NOT NULL DEFAULT 'QUEUED',
  ADD COLUMN "progress" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "retryable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "nextAttemptAt" TIMESTAMP(3),
  ADD COLUMN "startedAt" TIMESTAMP(3),
  ADD COLUMN "heartbeatAt" TIMESTAMP(3),
  ADD COLUMN "lockedUntil" TIMESTAMP(3),
  ADD COLUMN "completedAt" TIMESTAMP(3),
  ADD COLUMN "errorCode" TEXT,
  ADD COLUMN "errorMessage" TEXT,
  ADD COLUMN "result" JSONB;

CREATE INDEX "import_jobs_status_nextAttemptAt_createdAt_idx"
  ON "import_jobs"("status", "nextAttemptAt", "createdAt");
CREATE INDEX "import_jobs_completedAt_idx" ON "import_jobs"("completedAt");

UPDATE "import_jobs"
SET status = 'PENDING', stage = 'QUEUED', "lockedUntil" = NULL, "nextAttemptAt" = CURRENT_TIMESTAMP
WHERE status = 'IN_PROGRESS';

UPDATE "import_jobs"
SET "retryable" = false
WHERE status = 'FAILED';

UPDATE "import_jobs"
SET "retryable" = false, "errorCode" = 'TMDB_404', "errorMessage" = 'Movie not found on TMDB'
WHERE status = 'FAILED' AND logs::text ILIKE '%not found on TMDB%';

UPDATE "import_jobs"
SET status = 'PENDING', "retryable" = true, "errorCode" = 'LEGACY_SCHEMA_MISMATCH', "nextAttemptAt" = CURRENT_TIMESTAMP
WHERE status = 'FAILED' AND logs::text ILIKE '%Unknown argument `imdbId`%';

UPDATE "import_jobs"
SET status = 'PENDING', "retryable" = true, "errorCode" = 'TMDB_RATE_LIMIT', "nextAttemptAt" = CURRENT_TIMESTAMP
WHERE status = 'FAILED' AND (logs::text ILIKE '%rate limit%' OR logs::text ILIKE '%429%');

CREATE TABLE "import_batches" (
  "id" TEXT NOT NULL,
  "status" "ImportBatchStatus" NOT NULL DEFAULT 'PENDING',
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "countryCode" TEXT,
  "currentPage" INTEGER NOT NULL DEFAULT 1,
  "totalPages" INTEGER NOT NULL DEFAULT 0,
  "queuedCount" INTEGER NOT NULL DEFAULT 0,
  "skippedCount" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "nextRunAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "import_batches_status_nextRunAt_createdAt_idx"
  ON "import_batches"("status", "nextRunAt", "createdAt");
