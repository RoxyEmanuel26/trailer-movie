# Table Design: Movies

The `movies` table is the central hub of the database.

## Fields
- **id** (UUID/BIGINT) - Primary Key
- **title** (VARCHAR) - Required. The official movie title.
- **slug** (VARCHAR) - Required, Unique. URL-friendly identifier (e.g., `dune-part-two-2024`).
- **original_title** (VARCHAR) - Optional. For foreign films.
- **synopsis** (TEXT) - Optional.
- **release_date** (DATE) - Required.
- **status** (ENUM) - Required. (`draft`, `published`, `archived`). Defaults to `draft`.
- **runtime_minutes** (INTEGER) - Optional.
- **mpaa_rating** (VARCHAR) - Optional. (e.g., 'PG-13', 'R').
- **poster_url** (VARCHAR) - Optional. URL to the primary vertical image.
- **backdrop_url** (VARCHAR) - Optional. URL to the primary horizontal image.
- **tmdb_id** (INTEGER) - Optional, Unique. External ID for sync tracking.
- **locked_fields** (JSON) - Optional. Array of field names (e.g., `["synopsis", "poster_url"]`) that admins have manually overridden and should be ignored by the TMDB sync script.

## Timestamps
- **created_at** (TIMESTAMP)
- **updated_at** (TIMESTAMP)
- **deleted_at** (TIMESTAMP) - For soft deletes.

## Indexes
- `INDEX(slug)` - Crucial for fast routing on public pages.
- `INDEX(release_date)` - Used heavily for "Upcoming" and "Recent" sorting.
- `INDEX(status)` - Used to filter out drafts on public queries.
- `INDEX(tmdb_id)` - Used during sync jobs to find existing records.
- `COMPOUND INDEX(status, release_date)` - Highly optimized for the homepage feed.
