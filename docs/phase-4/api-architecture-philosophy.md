# API Architecture Philosophy

## Core Principles
The API integration layer acts as the vital connective tissue between our local database, external data providers, the public frontend, and the admin CMS. The overarching philosophy is **Separation of Concerns via Service Abstraction**. 

## Data Sourcing Strategy
- **External APIs:** Raw metadata (synopses, release dates, TMDB IDs, YouTube video IDs) is fetched from external providers purely to populate or update the local database. The frontend *never* calls external movie APIs directly.
- **Internal APIs:** All public-facing frontend requests (e.g., fetching a movie detail page) hit our internal API endpoints, which query our local, optimized database.
- **Service Abstraction:** Every interaction with an external provider or complex database operation must be wrapped in a dedicated Service class (e.g., `TmdbService`, `MovieService`). Controllers/Route handlers must never contain raw HTTP calls to external providers or raw SQL/ORM queries.

## Caching Strategy
- Public-facing internal API endpoints (e.g., `/api/movies/trending`) must be aggressively cached at the edge (CDN) or via an in-memory store (Redis).
- External API responses (e.g., hitting TMDB during a sync) should be temporarily cached to prevent hitting rate limits during batch imports.

## Endpoint Visibility
- **Public Endpoints:** Read-only routes accessible without authentication (`GET /api/movies/:slug`). Protected by rate limiting and CDN caching.
- **Admin-Only Endpoints:** Strict authentication and RBAC-authorized routes for CMS operations (`POST /api/admin/movies`).
- **Internal-Only Endpoints:** Routes meant only for server-to-server communication (e.g., cron jobs triggering a sync), protected by internal network rules or static bearer tokens.
