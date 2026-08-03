# Caching Strategy

Performance is a core design principle. The API layer must aggressively cache responses to survive traffic spikes and reduce database load.

## 1. Provider Response Caching (External)
- **Target:** Calls to TMDB or YouTube APIs.
- **TTL:** 1 Hour - 24 Hours (depending on the endpoint).
- **Rationale:** If an admin triggers a sync for a movie, and then a background job triggers a sync for the same movie 5 minutes later, we should not burn our external API quota. 

## 2. Public Endpoint Caching (Internal)
- **Target:** `/api/v1/movies/:slug`, `/api/v1/movies/trending`, `/api/v1/genres`.
- **Strategy:** If using Next.js/Nuxt, leverage **Incremental Static Regeneration (ISR)**. The page/API response is cached indefinitely at the edge (CDN) until explicitly revalidated.
- **Fallback TTL:** If ISR is not used, rely on Redis caching with a TTL of 1 hour for high-traffic endpoints.

## 3. Cache Invalidation Rules
Cache must be invalidated proactively by the Admin CMS, not just relying on TTL timeouts.
- **When a Movie is updated/published:** The `MovieService` triggers a cache purge for:
  - That specific movie's detail route.
  - The homepage/trending routes (if the movie appears there).
  - The specific genre pages the movie belongs to.
- **When a Homepage Section is reordered:** The CMS triggers a purge of the `/api/v1/homepage` route.

## 4. Uncacheable Endpoints
- Search endpoints (`/api/v1/search?q=...`) should not be heavily cached on the server due to the high cardinality of queries (though the frontend can memoize recent searches).
- Analytics tracking (`POST /api/v1/analytics/track`) must never be cached.
