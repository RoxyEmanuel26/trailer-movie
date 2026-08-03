# Event Metadata Design

## Shared Context Structure

To make analytics events sortable, filterable, and useful, they must share a consistent metadata schema.

### Standard Metadata Fields (Attached to almost all events)
- `event_name` (Required): e.g., "trailer_play".
- `timestamp` (Required): ISO 8601 UTC timestamp of when the event occurred.
- `route_path` (Required): The URL path where the event happened (e.g., `/movie/dune`).
- `session_id` (Required for behavioral, optional for system): A hashed, rolling, anonymous ID to tie a sequence of events together without identifying the user permanently.
- `device_type` (Optional): e.g., "mobile", "desktop", "tablet" (derived from User-Agent).
- `country_code` (Optional): e.g., "US", "GB" (derived from IP before the IP is discarded).

### Context-Specific Metadata
- **Content Events (`movie_view`, `trailer_play`):**
  - `movie_id` (Required): The internal database ID of the movie.
  - `movie_title` (Optional/Convenience): To avoid constant DB lookups in analytics dashboards.
- **Search Events (`search_query`):**
  - `search_term` (Required): The string the user searched for.
  - `result_count` (Required): How many results were returned (critical for finding zero-result searches).
- **Admin Events (`movie_update`):**
  - `admin_id` (Required): The ID of the user performing the action.
  - `changes` (Optional): A high-level summary of what fields changed (do not include full payload to avoid logging secrets accidentally).

### Sensitivity Rules
- **No PII:** Never include plain-text IP addresses, email addresses, or names in behavioral event metadata.
- **IP Discarding:** If IP is used to derive `country_code` or `device_type`, the raw IP must be discarded immediately at the ingestion layer and not stored in the analytics database.
