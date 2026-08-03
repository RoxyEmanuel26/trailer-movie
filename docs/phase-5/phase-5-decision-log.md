# Phase 5 Decision Log

This document records the major architectural decisions and trade-offs made during the admin panel design phase.

## DECISION 001: Custom Admin UI vs. Headless CMS (Contentful/Sanity)
- **Decision:** We are building a custom admin panel tailored specifically to this database schema, rather than utilizing an off-the-shelf headless CMS.
- **Reasoning:** A movie trailer site relies heavily on fetching specific external data (TMDB, YouTube API health checks). A generic headless CMS cannot easily accommodate our specialized "Locked Fields" sync pattern or custom YouTube URL validation without writing extensive middleware anyway.
- **Trade-off:** Significantly increases frontend development time to build the admin UI components (tables, forms, media uploaders).

## DECISION 002: Soft Deletes over Hard Deletes
- **Decision:** Clicking "Delete" on a Movie hides it (`deleted_at`) rather than removing the row from PostgreSQL.
- **Reasoning:** User error is inevitable. Dropping a movie cascades to delete all its trailers and relationships. Soft deletes allow a 1-click restore.
- **Trade-off:** Forces every public API query to include `WHERE deleted_at IS NULL`. Requires a secondary cron job to permanently wipe data after 30 days to save disk space.

## DECISION 003: Distinct Edit Tabs vs. Long Scrolling Form
- **Decision:** The Movie Edit screen will use tabs (General, Trailers, Cast, SEO, Settings) rather than a single massive vertical form.
- **Reasoning:** Improves UX and speed. An SEO editor only needs the SEO tab. It also allows us to lazy-load the Cast/Trailer data only when the tab is clicked, improving admin dashboard performance.
- **Trade-off:** State management becomes slightly more complex (e.g., handling unsaved changes when a user switches tabs).

## DECISION 004: Centralized Media Library
- **Decision:** Images are uploaded to a global Media Library and referenced, rather than uploaded directly and tied exclusively to a single movie row.
- **Reasoning:** Allows an admin to upload a single "Summer Blockbuster" banner and use it across the Homepage Builder and an arbitrary Genre page simultaneously.
- **Trade-off:** Requires a polymorphic `media_assets` table and a slightly more complex UI for selecting existing images vs. uploading new ones.
