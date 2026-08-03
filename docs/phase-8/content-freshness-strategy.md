# Content Freshness Strategy

Google prefers sites that are actively maintained and updated. "Freshness" is a measurable ranking signal.

## 1. Automated Freshness Signals
- **The Homepage:** By prominently featuring a "Recently Added" or "Trending" section, the HTML of the homepage changes daily. This trains Googlebot to crawl the root domain frequently.
- **Hub Pages:** `/upcoming` and `/trending` update constantly based on release dates and user traffic, providing high freshness scores.

## 2. Triggering Sitemap Updates
- When a new movie is published, or an existing movie's `updated_at` timestamp changes (e.g., a new trailer is added to an existing movie), the `sitemap.xml` must automatically reflect the new `<lastmod>` date.
- The system should (optionally) ping Google Search Console's sitemap endpoint to notify them of the change.

## 3. Evergreen Content Maintenance
- Collection Pages (e.g., "Best Action Movies") can go stale. 
- The SEO Manager should periodically edit the rich text descriptions on these pages. Modifying the text updates the `updated_at` timestamp, signaling to Google that the page is actively curated and still relevant.
