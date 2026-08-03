# Endpoint Groups

## Public Endpoints (Read-Only)
Designed for the frontend application. Heavily cached, strictly GET requests (except analytics). No auth required.
- **`GET /api/v1/movies/trending`** - Returns homepage hero/trending content.
- **`GET /api/v1/movies/:slug`** - Returns full detail for a specific movie (trailers, cast, SEO).
- **`GET /api/v1/movies`** - Paginated, filterable list (by genre, year).
- **`GET /api/v1/genres`** - List of all active genres.
- **`GET /api/v1/search`** - Autocomplete and full search results.
- **`POST /api/v1/analytics/track`** - Lightweight endpoint to record page views or trailer plays (rate-limited).

## Admin Endpoints (CMS)
Requires secure authentication and role-based permissions.
- **`POST /api/admin/auth/login`** - Admin login.
- **`GET /api/admin/movies`** - Paginated list for data tables (includes drafts).
- **`POST|PUT /api/admin/movies`** - Create/Update movie metadata manually.
- **`DELETE /api/admin/movies/:id`** - Soft delete a movie.
- **`POST /api/admin/sync/tmdb`** - Trigger a manual TMDB import for a given ID.
- **`POST /api/admin/media/upload`** - Upload a custom poster/backdrop.
- **`GET /api/admin/layout/homepage`** - Manage homepage row ordering.
- **`GET /api/admin/logs`** - View the audit trail.

## Internal / System Endpoints
Requires static bearer token or internal network IP. Usually triggered by cron jobs (e.g., GitHub Actions or Vercel Cron).
- **`POST /api/system/cron/verify-trailers`** - Triggers the YouTube health check batch job.
- **`POST /api/system/cron/sync-upcoming`** - Triggers a sync of release dates for upcoming movies.
- **`GET /health`** - Basic liveness probe for monitoring systems.
