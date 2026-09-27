-- Track a bulk import through discovery and persistence instead of marking it
-- complete as soon as the last TMDB discovery page is read.
ALTER TYPE "ImportJobStatus" ADD VALUE IF NOT EXISTS 'SKIPPED';
ALTER TYPE "ImportJobStatus" ADD VALUE IF NOT EXISTS 'CANCELED';
ALTER TYPE "ImportBatchStatus" ADD VALUE IF NOT EXISTS 'IMPORTING';
ALTER TYPE "ImportBatchStatus" ADD VALUE IF NOT EXISTS 'CANCELED';

ALTER TABLE "import_jobs" ADD COLUMN "importBatchId" TEXT;
ALTER TABLE "import_batches"
  ADD COLUMN "importedCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "failedCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "unavailableCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "canceledAt" TIMESTAMP(3);

CREATE INDEX "import_jobs_importBatchId_status_idx" ON "import_jobs"("importBatchId", "status");
ALTER TABLE "import_jobs"
  ADD CONSTRAINT "import_jobs_importBatchId_fkey"
  FOREIGN KEY ("importBatchId") REFERENCES "import_batches"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
