# Canonical and Duplicate Control

Duplicate content confuses search engines, dilutes page authority, and can result in the wrong page ranking.

## 1. The Golden Rule of Canonicals
- **Every single page** on the site must have a self-referencing canonical tag in the `<head>`: `<link rel="canonical" href="https://domain.com/current-path">`.

## 2. Parameter Stripping
- If a user shares a link on Facebook, Facebook appends a tracking parameter: `?fbclid=123`.
- If Google crawls this, it sees a new URL.
- The canonical tag MUST strip these parameters and point back to the clean URL: `<link rel="canonical" href="https://domain.com/movie/dune">`. This consolidates all authority.

## 3. Filtered Lists
- Genre pages often have filters (e.g., `/genre/sci-fi?sort=oldest`).
- These filtered views should NOT be indexed as separate pages unless they are explicitly designed as programmatic SEO targets (e.g., `/genre/sci-fi/1982`).
- Therefore, `/genre/sci-fi?sort=oldest` must have a canonical tag pointing to `/genre/sci-fi`.

## 4. Alternate URL Forms
- The site must strictly enforce a trailing-slash policy (either always require them, or always remove them) via server-side 301 redirects (e.g., redirecting `/movie/dune/` to `/movie/dune`). Serving both returns a duplicate content penalty.
