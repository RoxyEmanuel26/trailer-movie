# Phase 15 Decision Log

## Continuity and Recovery Decisions

This document records the major strategic decisions made during Phase 15 regarding how data is protected and restored.

| Decision | Rationale | Trade-offs |
| :--- | :--- | :--- |
| **No Backups for Search/Caches** | Search indexes and caches are ephemeral. Rebuilding them from the primary database is faster and cheaper than paying to back them up continuously. | Increases the initial load on the primary database immediately following a restoration as indexes are rebuilt. |
| **Point-in-Time Recovery (PITR)** | Relying solely on daily snapshots means up to 24 hours of data loss. PITR ensures we lose a maximum of 5 minutes in a catastrophic failure. | Slightly higher database hosting costs to maintain continuous WAL archiving. |
| **Soft Deletes over Hard Deletes** | Allows editors to instantly recover from their own mistakes (e.g., deleting a movie) without requiring IT to perform a surgical database extraction from a backup. | Increases database size over time; requires careful indexing to ensure queries ignore deleted records efficiently. |
| **Immutable Secondary Storage** | Protects against ransomware or malicious internal actors wiping out both production and backups simultaneously. | Backups cannot be deleted early to save space, even if we want to. We must strictly adhere to the defined retention lifecycle. |
| **"Roll Forward" for Bad Migrations** | Attempting to write "down" migrations to undo a database change is highly error-prone and often causes data loss. Restoring a pre-deploy snapshot is safer. | Requires halting traffic (maintenance mode) during a data-related deployment failure, rather than a seamless instant rollback. |
