# CDN and Edge Strategy

## Pushing Content to the User

The edge network is the first line of defense and the primary driver of high performance for a global audience.

### Edge Caching Expectations
- **Static Assets (JS/CSS/Images):** Cached aggressively (1 year) at the edge.
- **Static HTML Routes (e.g., Privacy Policy):** Cached at the edge until a new deployment occurs.
- **Dynamic Content (e.g., Movie Details, Homepage):** Utilizes ISR (Incremental Static Regeneration) or Cache-Control `s-maxage` headers. The CDN serves a cached version of the page instantly, while revalidating the data from the origin server in the background.

### Invalidation and Purge Strategy
- The CMS (Phase 12) must trigger targeted cache purges.
- If an admin edits "Dune", the API sends a purge request to the CDN specifically for the tag or path associated with `/movie/dune`.
- Avoid "Purge All" commands in production, as this causes a massive spike in traffic to the origin server (cache stampede).

### Dynamic Page Handling (Edge Computing)
- Heavy processing (e.g., connecting to the database) happens at the origin server.
- Lightweight, latency-sensitive operations (e.g., A/B testing variations, geographic redirects, reading auth cookies to determine logged-in state) should be handled by Edge Functions (e.g., Cloudflare Workers, Vercel Edge Middleware) before the request even reaches the origin.

### Geo/Region Considerations
- The CDN naturally serves assets from the PoP (Point of Presence) closest to the user.
- If the primary database is in `us-east-1`, users in Europe will experience higher latency for dynamic API calls. The architecture must rely heavily on edge caching to mask this origin latency.
