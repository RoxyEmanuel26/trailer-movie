# Phase 3 Decision Log

This document records the major architectural decisions and trade-offs made during the database design phase.

## DECISION 001: Centralized Media Asset Table
- **Decision:** Uploaded files (custom posters, backdrops) will be tracked in a centralized polymorphic `media_assets` table rather than just storing a URL string in the `movies` table.
- **Reasoning:** It prevents orphan files on the storage provider (AWS S3) when records are deleted, allows storing file dimensions (critical for preventing CLS on the frontend), and makes it easy to add multiple images to an entity later.
- **Trade-off:** Requires a JOIN to fetch a custom poster image, though this is mitigated if the image URL is cached or eager-loaded.

## DECISION 002: The "Locked Fields" Sync Pattern
- **Decision:** Manual admin edits to synchronized data will be protected by storing an array of altered column names in a `locked_fields` JSON column on the `movies` table.
- **Reasoning:** Simple "Sync completely" vs "Don't Sync at all" boolean flags are too rigid. An admin might want to fix a typo in the synopsis but still receive automated updates for the release date. Granular field locking solves this.
- **Trade-off:** Adds complexity to the external API sync script (it must check the JSON array before updating every column).

## DECISION 003: Polymorphic SEO Table
- **Decision:** A single `seo_pages` table uses `seoable_type` and `seoable_id` to attach SEO overrides to Movies, Genres, or static routes.
- **Reasoning:** Prevents polluting every core table with 5+ SEO columns (`meta_title`, `meta_description`, `og_image`). It centralizes SEO logic into one model.
- **Trade-off:** Polymorphic relationships cannot use strict database-level foreign key constraints, requiring application-level enforcement to clean up SEO records when a Movie is deleted (or relying on database triggers).

## DECISION 004: Soft Deletes on Core Content
- **Decision:** The `movies` table utilizes a `deleted_at` timestamp for soft deletions.
- **Reasoning:** Accidentally deleting a movie with hundreds of connected trailers, genres, and cast members is catastrophic. Soft deletes hide the record immediately but allow a SuperAdmin to restore it.
- **Trade-off:** Every single public-facing query must include `WHERE deleted_at IS NULL`, slightly complicating raw SQL queries (though most ORMs handle this automatically).
