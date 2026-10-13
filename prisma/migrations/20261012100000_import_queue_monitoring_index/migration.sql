-- A small index for the active queue, excluding retained completed history.
-- Partial indexes are maintained in SQL, as with the existing expression/GIN indexes.
-- Do not wrap this migration in BEGIN: CONCURRENTLY keeps imports writable.
CREATE INDEX CONCURRENTLY "import_jobs_active_updatedAt_id_idx"
ON "import_jobs" ("updatedAt" DESC, "id" DESC)
WHERE "status" NOT IN ('COMPLETED', 'SKIPPED', 'CANCELED');
