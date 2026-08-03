# Final SEO Review

## Overview
Organic search is critical for a movie trailer website. The final SEO review ensures that search engines can accurately crawl, index, and understand the site's content.

## Verification Checklist

### 1. Indexable Page Coverage
*   [ ] Verify that all core pages (Homepage, Category pages, individual Movie pages) return a 200 OK status code.
*   [ ] Verify that no unintentional `noindex` or `nofollow` meta tags exist on pages meant for public consumption.

### 2. Metadata Correctness
*   [ ] Verify that every page has a unique `<title>` tag following a consistent format (e.g., "[Movie Name] Trailer - [Site Name]").
*   [ ] Verify that every page has a relevant `<meta name="description">`.
*   [ ] Verify Open Graph (`og:image`, `og:title`) and Twitter Card tags are present for social sharing.

### 3. Canonical Integrity
*   [ ] Verify that a self-referencing `<link rel="canonical">` tag exists on every page to prevent duplicate content issues (especially with URL parameters).

### 4. Sitemap and Robots.txt Readiness
*   [ ] Verify that `sitemap.xml` (or sitemap index) is dynamically generated and includes all valid movie URLs.
*   [ ] Verify that `robots.txt` allows crawling of public directories and blocks crawling of admin or private API routes.

### 5. Structured Data
*   [ ] Verify that Movie pages include valid JSON-LD structured data (e.g., `schema.org/Movie` or `schema.org/VideoObject`).
*   [ ] Test structured data against Google's Rich Results Test tool.

### 6. Internal Linking
*   [ ] Verify that there are no "orphan pages" (movie pages with no internal links pointing to them).
*   [ ] Verify that pagination or "Load More" functionality is crawlable by search engine bots (using standard `<a>` tags where possible).
