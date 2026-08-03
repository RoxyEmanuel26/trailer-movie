# Indexation Strategy

Not every page on the platform deserves to be in Google's index. We must tightly control what Googlebot crawls and indexes.

## 1. Strictly Indexable (The Crown Jewels)
These pages are the primary traffic drivers. They must be included in `sitemap.xml` and lack any `noindex` directives.
- **`/movie/[slug]`:** The core entity pages. 
- **`/genre/[slug]`:** Broad discovery pages (e.g., "Best Sci-Fi Trailers").
- **`/collection/[slug]`:** Curated editorial lists (e.g., "Marvel Cinematic Universe").
- **`/trending`, `/upcoming`, `/top-rated`:** Crucial hub pages that distribute link equity to newly added movies.

## 2. Noindex (Excluded Pages)
These pages provide zero organic search value and risk being flagged as "Thin Content" or "Soft 404s".
- **`/search?q=...`:** Never index search result pages. It creates infinite, low-quality URL permutations (crawl traps).
- **`/admin/*` and `/api/*`:** Strictly internal.
- **Empty Category Pages:** If a genre or collection has fewer than 3 movies, it should be dynamically set to `noindex` until it reaches a meaningful content threshold.

## 3. Indexable but Low Priority (Legal)
- **`/privacy`, `/terms`, `/dmca`:** Allow indexation for trust signals, but do not include them in the primary sitemap.
