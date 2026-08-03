# Pagination and Infinite Scroll SEO

Lists of movies (Genres, Collections) will inevitably exceed a single page. We must handle this without losing link equity.

## 1. Pagination Format
- Use clean query parameters for pagination: `/genre/action?page=2`.
- Do not use directory-style pagination (e.g., `/genre/action/page/2`) as it creates a false impression of deeper site architecture.

## 2. Canonical Behavior on Paginated Pages
- **Crucial Rule:** Page 2 (`?page=2`) MUST have a canonical tag pointing to ITSELF (`/genre/action?page=2`), NOT back to Page 1. 
- If Page 2 canonicalizes to Page 1, Google will ignore all the movie links on Page 2, trapping that content.

## 3. Infinite Scroll (Graceful Degradation)
- We are using a "Load More" button (as defined in Phase 6).
- When a user clicks "Load More", JS fetches the next set of movies.
- **SEO Fallback:** The "Load More" button MUST be an actual anchor tag (`<a href="?page=2">Load More</a>`) that JS intercepts. If Googlebot crawls the page (it doesn't click buttons with JS), it will simply follow the `href` to Page 2 like a traditional crawler, ensuring total discoverability.
