# Search Integration Strategy

Search is the primary discovery mechanism when a user knows exactly what they want.

## 1. Internal SQL Search (Phase 1 MVP)
- **Mechanism:** The `/api/v1/search` endpoint executes a basic SQL `ILIKE '%query%'` against the `movies.title` and `movies.original_title` columns.
- **Ranking:** Results are ordered by `release_date DESC` (newer movies first) or by a derived `popularity` score.
- **Limitations:** Cannot handle typos well ("Inceptin" won't match "Inception").

## 2. Search Provider Integration (Phase 3 Path)
To support typo-tolerance and lightning-fast keystroke autocomplete, the architecture must support swapping SQL search for a dedicated engine (Algolia, Meilisearch, ElasticSearch).
- **Service Abstraction:** The frontend calls our internal API `/api/v1/search`. The internal API calls `SearchService.query()`. The `SearchService` routes the query to Algolia. The frontend never possesses the Algolia API keys.
- **Indexing Trigger:** Whenever `MovieService.createMovie` or `updateMovie` is called, an event is fired to asynchronously update the Algolia index, keeping search results in sync with the database.

## 3. Empty-Result Handling
- If the search engine returns 0 results, the API should return a `200 OK` with an empty `data: []` array, NOT a `404 Not Found`. 
- The `meta` block should include an array of "suggested queries" or trending titles to prevent a dead-end UI experience.
