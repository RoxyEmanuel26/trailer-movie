# Operational Tools Design

A dedicated "System Tools" section empowers Super Admins to resolve technical issues without bothering developers.

## 1. Cache Management
- **Clear Global Cache:** Purges the entire Redis or CDN cache. (Warning: Causes a temporary spike in database load as the cache rebuilds).
- **Clear Route Cache:** An input field allowing the admin to invalidate a specific path (e.g., `/movies/dune`). 

## 2. Sync Triggers
- **Force Global Sync:** Manually triggers the nightly cron job to check TMDB for release date updates.
- **Verify All Trailers:** Manually triggers the YouTube API health check for all active trailers.

## 3. Search Index Management
If using Algolia or Meilisearch:
- **Rebuild Index:** Flushes the external search index and pushes all active movies from the local database. Necessary if the index gets out of sync or search settings change.

## 4. Maintenance Mode
- A giant toggle switch. Turning it on returns a `503 Service Unavailable` page for all public frontend routes, while keeping the Admin API and UI fully accessible. Vital during major database migrations.
