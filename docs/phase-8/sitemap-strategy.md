# Sitemap Strategy

A healthy sitemap ensures Google discovers new trailers instantly.

## 1. Sitemap Index
- Instead of one massive `sitemap.xml`, the root `sitemap.xml` will be a Sitemap Index file pointing to sub-sitemaps:
  - `/sitemap-movies.xml`
  - `/sitemap-genres.xml`
  - `/sitemap-collections.xml`
  - `/sitemap-static.xml`

## 2. Dynamic Generation
- Sitemaps must be dynamically generated (or regenerated on a cron schedule/webhook). Static, manually updated sitemaps will quickly become outdated as the TMDB sync adds new movies.

## 3. Exclusion Rules
- Any movie flagged as `is_published = false` in the database must be excluded.
- Any genre with fewer than 3 movies must be excluded.
- The `<priority>` and `<changefreq>` tags are largely ignored by Google today, so we will omit them to save payload size, focusing entirely on providing clean, valid URLs and `<lastmod>` dates.

## 4. Video Sitemap (Optional but Recommended)
- Standard sitemaps are fine, but a dedicated Video Sitemap (using `<video:video>` tags) explicitly tells Google where the YouTube embeds live, significantly increasing the chances of showing up in the Google Videos tab.
