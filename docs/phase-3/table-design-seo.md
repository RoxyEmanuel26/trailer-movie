# Table Design: SEO

The `seo_pages` table allows granular overrides for SEO metadata on any route or entity.

## 1. `seo_pages` Table
- **id** (UUID/BIGINT) - Primary Key
- **seoable_type** (VARCHAR) - Polymorphic type (e.g., `Movie`, `Genre`, `Page`).
- **seoable_id** (UUID/BIGINT) - Polymorphic ID.
- **route_path** (VARCHAR) - Optional. Used for static routes not tied to an entity (e.g., `/about`).
- **meta_title** (VARCHAR) - Optional. Overrides default generated titles.
- **meta_description** (TEXT) - Optional. Overrides default generated descriptions.
- **canonical_url** (VARCHAR) - Optional. Override if the canonical version exists elsewhere.
- **og_image_url** (VARCHAR) - Optional. Override the default poster/backdrop for social sharing.
- **is_noindex** (BOOLEAN) - Required. Defaults to `false`. If true, injects `<meta name="robots" content="noindex">`.
- **in_sitemap** (BOOLEAN) - Required. Defaults to `true`. Determines inclusion in `sitemap.xml`.

## Constraints & Indexes
- `UNIQUE(seoable_type, seoable_id)` - Ensure only one SEO record per entity.
- `UNIQUE(route_path)` - Ensure only one SEO record per static route.
- `INDEX(route_path)` - Fast lookup in middleware for static pages.

## Data Philosophy
SEO data should fall back gracefully. If a `Movie` has no `seo_pages` record, the application layer should programmatically generate the `meta_title` using the `Movie.title` and `Movie.release_date`. The `seo_pages` table is purely for manual **overrides**.
