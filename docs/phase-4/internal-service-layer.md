# Internal Service Layer

The Service Layer abstracts business logic away from HTTP controllers and route handlers.

## 1. `MovieService`
- **Purpose:** Handles CRUD operations and complex queries for movies.
- **Talks to:** `movies`, `movie_genres`, `movie_people` tables.
- **Methods:** `getMovieBySlug(slug)`, `getTrendingMovies(limit)`, `createMovie(data)`.
- **Must Not:** Handle HTTP request/response objects or direct external API calls.

## 2. `SyncService`
- **Purpose:** Manages the ingestion of data from external providers into the local database, respecting the `locked_fields` rules.
- **Talks to:** `TmdbProvider`, `MovieService`, `GenreService`.
- **Methods:** `syncMovieFromTmdb(tmdbId)`, `batchSyncUpcoming()`.
- **Must Not:** Be called synchronously during a public user request (must run in background jobs or explicit admin actions).

## 3. `TrailerVerificationService`
- **Purpose:** Checks the health of YouTube embeds.
- **Talks to:** `YouTubeProvider`, `trailers` table.
- **Methods:** `verifyTrailerHealth(trailerId)`, `batchVerifyActiveTrailers()`.

## 4. `SearchService`
- **Purpose:** Handles user search queries, abstracts the underlying search engine.
- **Talks to:** Local database (Phase 1) OR Algolia/Meilisearch (Phase 3).
- **Methods:** `searchMovies(query, filters)`, `indexMovie(movieId)`.

## 5. `SeoService`
- **Purpose:** Generates canonical URLs, meta tags, and schema.org JSON-LD.
- **Talks to:** `seo_pages` table, `movies` table (for fallbacks).
- **Methods:** `getSeoMetadataForRoute(path, entityType, entityId)`.

## 6. `HomepageService`
- **Purpose:** Aggregates data for the complex homepage view.
- **Talks to:** `homepage_sections`, `MovieService`.
- **Methods:** `getHomepageLayoutData()`.

## 7. `MediaService`
- **Purpose:** Handles file uploads and central registry management.
- **Talks to:** `media_assets` table, S3/Cloudflare R2 SDK.
- **Methods:** `uploadAsset(file, type, entityId)`, `deleteAsset(assetId)`.

## 8. `AuditService`
- **Purpose:** Logs admin actions.
- **Talks to:** `audit_logs` table.
- **Methods:** `logAction(userId, action, entity, oldData, newData)`.
