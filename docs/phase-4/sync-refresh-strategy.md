# Sync & Refresh Strategy

To ensure data remains fresh without overwhelming external APIs or overwriting manual curation, the `SyncService` dictates how external data enters the system.

## Trigger Methods

### 1. Manual Sync (Admin Driven)
- **Flow:** Admin pastes a TMDB ID into the CMS.
- **Behavior:** Synchronous execution. The API halts, fetches TMDB data, downloads posters to S3, inserts local database records, and returns the newly created Movie ID to the CMS so the admin can immediately review and edit it.

### 2. Scheduled Refresh (Cron Driven)
- **Flow:** Nightly cron job hits `/api/system/cron/sync-upcoming`.
- **Behavior:** Asynchronous execution. The script pulls all movies in the local database where `release_date` > Today. It queries TMDB to see if the release date has shifted or if a new poster is available.
- **Protection:** It strictly respects the `locked_fields` array. If an admin locked the `release_date`, the sync script ignores the TMDB response for that field.

### 3. Trailer Health Check (Cron Driven)
- **Flow:** Nightly cron job hits `/api/system/cron/verify-trailers`.
- **Behavior:** Batches YouTube IDs from the `trailers` table (50 at a time). Checks their status. If a video is removed by the studio, it marks the local trailer as `inactive` and logs a critical alert to the `audit_logs`.

## Fallback & Retry Policies
- **TMDB Outage:** If TMDB goes down during a cron sync, the script logs a `SYNC_FAILED` event and exits gracefully. The local database remains the source of truth, so the public site is completely unaffected.
- **Retry with Backoff:** External API requests should use an exponential backoff library (e.g., retry after 2s, 4s, 8s) to handle transient 429 Too Many Requests or 503 Service Unavailable errors.
