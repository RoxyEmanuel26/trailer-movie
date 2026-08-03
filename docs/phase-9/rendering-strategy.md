# Rendering Strategy

## Rendering Approaches

The choice of rendering dictates how quickly content appears and how interactive the page is. We will use a hybrid approach based on the specific needs of each page type.

### Public Site Rendering

#### Static Generation (SSG) / Incremental Static Regeneration (ISR)
- **Target Pages:** Homepage, Category Pages, Movie Detail Pages (for popular/trending movies), Legal Pages.
- **Rationale:** These pages are read-heavy and read by all users. Generating the HTML at build time or revalidating in the background (ISR) ensures incredibly fast TTFB and immediate content availability.
- **Behavior:** The CDN serves pre-rendered HTML. Client-side hydration attaches interactivity after the initial paint.

#### Server-Side Rendering (SSR)
- **Target Pages:** Search Results, Personalized Recommendations, Movie Detail Pages (for long-tail, rarely accessed movies).
- **Rationale:** When content is highly dynamic, user-specific, or the sheer volume of pages makes full static generation impractical, SSR ensures the content is available on the first request for SEO and immediate viewing, without a loading spinner.

#### Streaming Behavior
- **Application:** For SSR pages, leverage HTML streaming (if supported by the framework).
- **Rationale:** Send the shell of the page (header, layout) instantly, and stream in heavier dynamic content chunks (like related movies or reviews) as they resolve on the server.

### Admin Panel Rendering

#### Client-Side Rendering (CSR)
- **Target Pages:** Entire Admin Dashboard.
- **Rationale:** The admin panel is a heavily interactive, authenticated application where SEO is irrelevant. CSR allows for highly dynamic, stateful UI experiences (complex forms, data grids) without full-page reloads. Initial load time is less critical than ongoing interaction speed.

### Hydration Control
- **Progressive Hydration:** Only hydrate components that require interactivity (e.g., video player, search bar, carousel controls).
- **Static Components:** Keep purely presentational elements (e.g., text descriptions, basic lists) static to reduce the JavaScript payload and main thread execution time.
