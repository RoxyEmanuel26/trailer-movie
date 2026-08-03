# Performance Tuning Strategy

## Overview
Web performance degrades naturally over time as new features, scripts, and content are added. A continuous performance tuning strategy is required to maintain fast load times and pass Core Web Vitals.

## Image Optimization Review
*   **Cadence:** Monthly.
*   **Action:** Verify that image optimization pipelines are working (e.g., serving WebP/AVIF formats). Check that content editors are not bypassing image size limits. Ensure lazy loading is applied correctly to images below the fold.

## Bundle Size Review
*   **Cadence:** Bi-weekly (or per major PR).
*   **Action:** Monitor JavaScript and CSS bundle sizes using CI/CD tools. If a new dependency significantly increases the bundle size, evaluate alternatives or implement code-splitting to load it only when necessary.

## Route Timing Review
*   **Cadence:** Monthly.
*   **Action:** Analyze server-side response times and Time to First Byte (TTFB) for dynamic routes. Identify slow database queries or slow third-party API calls that need caching or optimization.

## Media Load Review (Video)
*   **Cadence:** Quarterly.
*   **Action:** Video embeds (YouTube/Vimeo) are heavy. Ensure facade patterns (loading a static image first, swapping to iframe on click/interaction) are still functioning correctly and haven't regressed.

## Cache Tuning
*   **Cadence:** Quarterly.
*   **Action:** Review CDN hit/miss ratios. Adjust `Cache-Control` headers for static assets and API responses. Ensure Stale-While-Revalidate (SWR) strategies are optimized for data freshness vs. speed.

## CLS (Cumulative Layout Shift) Review
*   **Cadence:** Monthly.
*   **Action:** Monitor Core Web Vitals reports. Identify pages where content jumps during load (usually due to un-dimensioned images, ad injections, or late-loading web fonts). Fix by reserving space in the CSS layout.

## Admin Performance Tuning
*   **Cadence:** Bi-annually.
*   **Action:** The admin panel often gets neglected. Ensure large data tables paginate correctly and that heavy admin operations (like bulk editing) do not crash the browser or the server.

## Mobile Experience Tuning
*   **Cadence:** Monthly.
*   **Action:** Run performance tests specifically on throttled mobile network profiles (e.g., Fast 3G). Ensure touch targets are appropriately sized and that mobile-specific layouts render without blocking the main thread.
