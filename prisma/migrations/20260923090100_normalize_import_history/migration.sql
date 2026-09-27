-- Run data normalization after the enum additions have committed.
UPDATE "import_jobs"
SET status = 'SKIPPED', stage = 'SKIPPED', progress = 100,
    "completedAt" = COALESCE("completedAt", CURRENT_TIMESTAMP),
    retryable = false, "lockedUntil" = NULL, "nextAttemptAt" = NULL
WHERE status = 'FAILED'
  AND ("errorCode" = 'TMDB_404' OR ("errorCode" = 'NON_RETRYABLE' AND "errorMessage" ILIKE '%not found on TMDB%'));

-- These failures came from an obsolete generated Prisma client before the
-- current Movie fields existed. Requeue them once so the current importer can
-- persist them normally.
UPDATE "import_jobs"
SET status = 'PENDING', stage = 'QUEUED', progress = 0, "attemptCount" = 0,
    retryable = true, "nextAttemptAt" = CURRENT_TIMESTAMP,
    "startedAt" = NULL, "heartbeatAt" = NULL, "lockedUntil" = NULL,
    "completedAt" = NULL, "errorCode" = NULL, "errorMessage" = NULL
WHERE status = 'FAILED'
  AND "errorCode" IS NULL
  AND logs::text ILIKE '%Unknown argument `voteAverage`%';
