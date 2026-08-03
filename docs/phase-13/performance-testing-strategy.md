# Performance Testing Strategy

## Guarding the Web Vitals

A slow trailer site is an abandoned trailer site. Performance is treated as a functional requirement, meaning a performance regression is treated exactly like a broken button.

### Automated Performance Budgets
- Use tools like Lighthouse CI or WebPageTest integrations in the CI/CD pipeline.
- Assert that the Homepage and Movie Detail Page meet strict Core Web Vitals thresholds on simulated mobile networks before a PR can be merged.
  - **LCP (Largest Contentful Paint):** Must be < 2.5s.
  - **CLS (Cumulative Layout Shift):** Must be < 0.1.

### Initial Load vs. Route Transition
- **Initial Load:** Test the "Cold Start" (e.g., a user arriving directly from Google). This verifies Server-Side Rendering (SSR) and CDN caching are working.
- **Route Transition:** Test the "Warm Start" (e.g., clicking from the homepage to a movie). This verifies that client-side hydration and prefetching are snappy.

### Media and Search Responsiveness
- **Search:** Write an integration test that asserts the search API endpoint returns results in under 200ms.
- **Media:** Assert that video player bundles are lazily loaded (not included in the initial JavaScript bundle).

### Regression Thresholds
- Set baseline metrics. If a new PR increases the main JavaScript bundle size by more than 10%, or degrades LCP by more than 300ms compared to the `main` branch, the CI pipeline must fail, requiring developer justification to proceed.
