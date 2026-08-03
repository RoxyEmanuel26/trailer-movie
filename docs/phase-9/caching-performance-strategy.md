# Caching Performance Strategy

## Cache Usage and Principles

Caching is the primary mechanism for scaling the application and reducing response times.

### Page-Level Caching Ideas
- **CDN / Edge Caching:** Public, static pages (SSG) should be aggressively cached at the CDN edge.
- **Cache-Control Headers:** Implement robust `Cache-Control` headers. Use `s-maxage` for CDN caching and `max-age` for browser caching.

### Data-Level Caching Ideas
- **API Responses:** Cache frequent API responses (e.g., "Trending Movies", "Genres list") in a fast data store (like Redis) on the backend to reduce database load.

### Stale-While-Revalidate (SWR) Suitability
- SWR is ideal for public data that updates occasionally but doesn't require real-time accuracy for every user (e.g., movie ratings, view counts). Serve the cached version instantly, and update the cache asynchronously.

### Invalidation Principles
- **Targeted Invalidation:** When content is updated in the admin panel, trigger targeted invalidation (cache purging) for the specific URLs or data tags associated with that content, rather than purging the entire cache.
- **Time-Based Expiration:** For data that changes predictably (e.g., daily trending lists), rely on time-based expiration (`max-age`).

### Cache Warm-up Ideas
- After deploying updates or flushing caches, use scripts to preemptively fetch the most critical pages (homepage, top categories) to populate the edge cache before users hit those pages.

### Cache Safety for Admin vs. Public Content
- **Strict Separation:** Admin panel content and authenticated user data MUST NEVER be cached on the public CDN.
- **Headers:** Ensure authenticated requests include `Cache-Control: private, no-store` to prevent accidental leakage of sensitive information or stale authenticated states.
