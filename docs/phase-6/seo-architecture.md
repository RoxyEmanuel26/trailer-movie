# SEO Architecture

The public site must be perfectly optimized for search engine bots to crawl and understand the relationships between movies, trailers, and genres.

## 1. Indexable vs. Non-Indexable Pages
- **Indexable:** `/movie/*`, `/genre/*`, `/collection/*`, `/upcoming`, `/trending`.
- **Non-Indexable (`<meta name="robots" content="noindex">`):** Search result pages (`/search?q=...`) to prevent crawl traps and infinite low-quality pages. Legal pages (`/privacy`, `/terms`) are often indexed but can be noindexed depending on preference; generally leave them indexable but don't heavily link them.

## 2. Canonicalization
- Every page must have a self-referencing canonical tag (`<link rel="canonical" href="https://domain.com/movie/dune">`) to prevent duplicate content issues if URL query parameters (like `?ref=twitter`) are added.

## 3. Structured Data (JSON-LD)
- **Movie Pages:** Must inject both `Movie` schema (detailing the cast, release date, and director) and `VideoObject` schema (detailing the trailer URL, upload date, and duration). Google relies heavily on `VideoObject` schema to feature videos in the SERP carousel.
- **Breadcrumbs:** Must use `BreadcrumbList` schema to define the site hierarchy.

## 4. XML Sitemap
- A dynamically generated `sitemap.xml` (or sitemap index pointing to `/sitemaps/movies.xml` and `/sitemaps/genres.xml`) is required.
- It must be pinged to Google Search Console whenever a new movie is published.
