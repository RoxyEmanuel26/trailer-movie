# Data Fetching Performance Strategy

## Request Efficiency

Efficient data fetching is crucial for fast rendering and minimizing server load.

### Server-Side Fetch Behavior
- **Proximity:** Data fetching required for SSR or SSG should happen on the server, as close to the database/API as possible, minimizing latency.
- **Parallel Fetching:** When a page requires data from multiple sources (e.g., movie details + related movies + reviews), fetch these concurrently rather than sequentially.

### Client Fetch Behavior
- **Defer Non-Critical Data:** Only fetch essential data on the initial load. Fetch secondary data (e.g., user comments below the fold) client-side after the main content is rendered.
- **SWR (Stale-While-Revalidate):** Utilize SWR patterns for client-side fetching. Return stale cached data immediately, then revalidate in the background to keep the UI feeling instantly responsive.

### Prefetch Rules
- **Hover Intent:** On desktop, prefetch data for a movie detail page when the user hovers over a movie poster.
- **Viewport Intersection:** On mobile, consider lightly prefetching data for the next logical pages as links enter the viewport.
- **Restraint:** Do not over-prefetch, especially on mobile networks, to avoid wasting bandwidth.

### Deduplication of Identical Requests
- Implement request deduplication (e.g., via a query client library) to ensure that if multiple components request the same data simultaneously, only one network request is made.

### Avoiding Waterfall Patterns
- Carefully structure component trees and data dependencies to avoid scenarios where Component A must fetch data before Component B can even *start* fetching its data. Lift data fetching requirements to route level where possible to enable parallel requests.

### Pagination Data Loading Strategy
- Use cursor-based pagination for infinite scroll or "Load More" patterns.
- Fetch the next page of data slightly before the user reaches the end of the current list to provide a seamless scrolling experience.
