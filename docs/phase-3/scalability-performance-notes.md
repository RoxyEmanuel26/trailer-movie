# Scalability & Performance Notes

## Query Optimization (Avoiding Joins)
The homepage and movie listings are the highest traffic areas.
- **Pattern to Avoid:** Querying 20 movies, then executing 20 separate queries to fetch their genres (N+1 problem).
- **Solution:** While data is normalized in pivot tables, the application layer should utilize Eager Loading (fetching movies and their genres in 2 queries total using `IN` clauses) or rely on materialized views if performance degrades.

## Indexing Strategy
- **Read-Heavy Fields:** Indexes are applied to all Foreign Keys (e.g., `movie_id` on trailers) and routing fields (`slug`).
- **Filter Fields:** Compound indexes on `(status, release_date)` optimize the most common query: "Show me published movies ordered by newest".

## Cache-Friendly Design
- **Entities are immutable where possible.** Once a movie is published, its core metadata rarely changes. This makes it highly cacheable at the edge (CDN/Vercel) or via Redis.
- **Invalidation:** The database `updated_at` timestamp is used as a cache-busting key. If `updated_at` changes, the application knows to flush the cached HTML for that movie's detail page.

## Search Performance
- For Phase 1 MVP, standard SQL `LIKE '%term%'` on the indexed `title` column is sufficient.
- **Future Expansion:** As the catalog grows, standard `LIKE` queries will become too slow. The architecture anticipates integrating a dedicated search engine (like Meilisearch, Algolia, or Postgres Full-Text Search) by tracking entity creation/updates via `audit_logs` or webhooks.
