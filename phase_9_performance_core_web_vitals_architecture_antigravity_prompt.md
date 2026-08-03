# Phase 9 — Performance & Core Web Vitals Architecture

## Goal
You are working on **Phase 9 only** for a website trailer movie project.

Your task is to define the complete performance architecture before any performance-oriented implementation is written.

Do **not** create frontend optimization code, image pipeline code, caching code, or implementation logic yet.

The purpose of this phase is to ensure the product is fast, responsive, stable, and efficient on real devices, especially mobile.

---

## Primary Objective
Create a complete performance architecture for a modern movie trailer website that supports:

- Fast first load
- Stable layouts
- Efficient image handling
- Controlled video loading
- Responsive navigation
- Smart data fetching
- Caching-aware rendering
- Minimal JavaScript overhead
- Good Core Web Vitals
- Sustainable scale under growth

The performance strategy must be practical, measurable, and compatible with the SEO and UX goals of the site.

---

## What You Must Design

### 1) Performance Philosophy
Define the core principles that should guide all performance decisions.

Answer:
- What does “fast” mean for this product?
- Which experiences matter most to optimize?
- What should be prioritized over perfection?
- What performance sacrifices are unacceptable?

### 2) Core Web Vitals Strategy
Define how the site should target the major web vitals and related metrics.

Include:
- LCP strategy
- INP strategy
- CLS strategy
- TTFB awareness
- Mobile performance awareness
- Viewport-specific loading priorities

Explain what parts of the site most influence each metric.

### 3) Rendering Strategy
Define the rendering model for the public site and admin panel.

Include conceptual choices for:
- Server rendering
- Static generation
- Incremental regeneration
- Client-side rendering
- Streaming behavior if applicable
- Hydration control

Explain which page types should use which rendering strategy and why.

### 4) Image Performance Strategy
Define how images should be handled.

Include:
- Poster image loading rules
- Backdrop image loading rules
- Thumbnail loading rules
- Fallback image behavior
- Responsive image sizes
- Preload priorities
- Image format considerations
- Aspect ratio stability
- Lazy loading strategy

### 5) Video Performance Strategy
Define how trailer/video content should be loaded efficiently.

Include:
- When the video player should load
- Thumbnail-first strategy if needed
- Autoplay expectations if any
- User-triggered loading behavior
- Embedded player performance concerns
- Fallback handling when video data is missing or slow

### 6) JavaScript Budget Strategy
Define rules for keeping JavaScript lean.

Include:
- Which UI areas need interactivity
- Which areas should remain mostly static
- Component-level hydration discipline
- Avoiding unnecessary client bundles
- Route-level bundle splitting
- Vendor dependency restraint

### 7) Data Fetching Performance Strategy
Define how data should be fetched efficiently.

Include:
- Server-side fetch behavior
- Client fetch behavior
- Prefetch rules
- Deduplication of identical requests
- Cache reuse opportunities
- Avoiding waterfall patterns
- Pagination data loading strategy

### 8) Caching Performance Strategy
Define caching behavior from a performance standpoint.

Include:
- Page-level caching ideas
- Data-level caching ideas
- CDN or edge caching ideas
- Stale-while-revalidate suitability
- Invalidation principles
- Cache warm-up ideas
- Cache safety for admin vs public content

### 9) Layout Stability Strategy
Define how the product avoids visual instability.

Include:
- Space reservation for media
- Skeleton and placeholder behavior
- Font loading stability
- Ad slot reservation if applicable
- Dynamic content insertion rules
- Error and fallback layout behavior

### 10) Navigation and Interaction Performance
Define how the UI should remain responsive.

Include:
- Menu interaction cost
- Search interaction cost
- Filter interaction cost
- Scroll performance
- Animation limits
- Debounce or throttle ideas if needed
- Touch interaction responsiveness

### 11) Critical Resource Prioritization
Define how the app should decide what loads first.

Include:
- Above-the-fold priorities
- Hero image priority
- Title and metadata priority
- Navigation priority
- Critical CSS or style priorities
- Deferred non-critical content

### 12) Route Transition Performance
Define how page-to-page navigation should feel.

Include:
- Prefetch strategy for likely next pages
- Transition smoothness
- Avoiding full-page flashes
- Loading state behavior
- Suspense or skeleton usage if needed
- Back navigation behavior

### 13) Mobile Performance Strategy
Define mobile-specific performance rules.

Include:
- Low-end device awareness
- Slow network awareness
- Reduced motion support
- Touch target responsiveness
- Image/video restraint on cellular networks
- Simplified mobile layouts

### 14) Admin Panel Performance Strategy
Define performance rules for the admin panel.

Include:
- Large table handling
- Search/filter responsiveness
- Bulk action efficiency
- Heavy form behavior
- Media library handling
- Dashboard widget loading
- Avoiding admin bloat

### 15) Perceived Performance Strategy
Define how the app should feel fast even when data is still loading.

Include:
- Skeleton screens
- Progressive disclosure
- Placeholder cards
- Immediate feedback on clicks
- Optimistic UI only where safe
- Graceful loading transitions

### 16) Monitoring and Measurement Strategy
Define how performance should be observed.

Include:
- Web vitals tracking
- Page timing metrics
- Interaction latency metrics
- API latency tracking
- Error rate monitoring
- Route-level performance comparison
- Content-type performance comparison

### 17) Performance Regression Control
Define how slowdowns should be prevented.

Include:
- Performance budget thresholds
- Review process before adding heavy dependencies
- Media size limits
- Component complexity controls
- Testing rules before release
- Regression alert ideas

### 18) Content Scaling Strategy
Define how performance should hold up as content grows.

Include:
- Large catalog handling
- Search result performance
- Trending page performance
- Collection page performance
- Infinite content growth protection
- Archive or pruning strategy if needed

### 19) Accessibility-Performance Balance
Define how performance and accessibility should work together.

Include:
- Motion reduction support
- Focus state responsiveness
- Screen reader friendliness without heavy overhead
- Semantic HTML with low cost
- Keyboard accessibility impact on performance

### 20) Future Performance Expansion Readiness
Prepare for future enhancements such as:
- Personalized pages
- Smarter prefetching
- AI-assisted content loading
- Advanced caching layers
- Performance dashboards
- Edge rendering experimentation

Do not implement these now, but keep the architecture open.

---

## Required Deliverables
Create the following documents in Markdown.

### `/docs/phase-9/`
- `performance-philosophy.md`
- `core-web-vitals-strategy.md`
- `rendering-strategy.md`
- `image-performance-strategy.md`
- `video-performance-strategy.md`
- `javascript-budget-strategy.md`
- `data-fetching-performance.md`
- `caching-performance-strategy.md`
- `layout-stability-strategy.md`
- `navigation-interaction-performance.md`
- `critical-resource-prioritization.md`
- `route-transition-performance.md`
- `mobile-performance-strategy.md`
- `admin-panel-performance.md`
- `perceived-performance-strategy.md`
- `monitoring-measurement-strategy.md`
- `performance-regression-control.md`
- `content-scaling-strategy.md`
- `accessibility-performance-balance.md`
- `future-performance-readiness.md`
- `phase-9-summary.md`
- `phase-9-decision-log.md`

---

## Required Structure for Each Document
Each document should be written clearly and professionally with:

- Clear headings
- Direct explanations
- Decision-oriented language
- No unnecessary fluff
- No vague performance suggestions without rationale
- No implementation code
- No optimization code snippets

---

## What Each File Must Contain

### `performance-philosophy.md`
Explain the guiding principles of the site’s performance strategy.

### `core-web-vitals-strategy.md`
Define the target behavior for LCP, INP, CLS, and related metrics.

### `rendering-strategy.md`
Define the rendering approach for public and admin surfaces.

### `image-performance-strategy.md`
Define media loading, resizing, and fallback behavior.

### `video-performance-strategy.md`
Define efficient trailer loading and player behavior.

### `javascript-budget-strategy.md`
Define bundle discipline and interactivity limits.

### `data-fetching-performance.md`
Define request efficiency, deduplication, and loading behavior.

### `caching-performance-strategy.md`
Define cache usage and invalidation principles.

### `layout-stability-strategy.md`
Define how to prevent CLS and layout instability.

### `navigation-interaction-performance.md`
Define interaction responsiveness for navigation and controls.

### `critical-resource-prioritization.md`
Define how critical content should load first.

### `route-transition-performance.md`
Define fast and stable navigation between routes.

### `mobile-performance-strategy.md`
Define mobile-first performance rules.

### `admin-panel-performance.md`
Define performance expectations for the admin interface.

### `perceived-performance-strategy.md`
Define how to make the site feel fast during loading.

### `monitoring-measurement-strategy.md`
Define how performance will be measured and monitored.

### `performance-regression-control.md`
Define how slowdowns and regressions are prevented.

### `content-scaling-strategy.md`
Define how performance holds up as the catalog grows.

### `accessibility-performance-balance.md`
Define how accessibility and speed should coexist.

### `future-performance-readiness.md`
Explain how the architecture can support future optimization layers.

### `phase-9-summary.md`
Provide a concise summary of all performance decisions.

### `phase-9-decision-log.md`
Record the final performance architecture choices and trade-offs.

---

## Rules

1. **Do not write implementation code yet**.
2. **Do not create optimization utilities yet**.
3. **Do not create image pipeline code yet**.
4. **Do not create performance scripts yet**.
5. **Do not ignore perceived performance**.
6. **Do not trade stability for raw speed**.
7. **Prefer predictable performance over clever complexity**.
8. **Protect mobile and low-end devices**.
9. **Document measurement and regression control clearly**.
10. **Document trade-offs, not just speed tips**.

---

## Quality Bar
The output should be detailed enough that another engineer or AI agent can implement the performance layer without guessing.

The performance architecture must answer:
- What makes the site fast?
- What loads first?
- What should be deferred?
- How are images and videos controlled?
- How is layout stability protected?
- How is performance measured?
- How are regressions prevented?
- How does performance scale with growth?

---

## Completion Criteria
Phase 9 is complete only if:
- All required Markdown files are created
- Core Web Vitals strategy is defined
- Rendering strategy is defined
- Image and video performance rules are defined
- JavaScript budget rules are defined
- Caching and data-fetching performance are defined
- Layout stability rules are defined
- Monitoring and regression controls are defined
- Final decisions are recorded
- No implementation code has been written

---

## Output Format
When you finish, respond with:
1. A short status summary
2. The list of files created
3. Any unresolved performance questions that should be answered before Phase 10

Do not begin Phase 10 until Phase 9 is fully approved.

