# Entity Overview

The database is built around the following core entities, categorized by their domain.

## Core Content
- **movies:** The central entity. Represents a distinct cinematic release.
- **trailers:** The actual video assets linked to a movie. Can be teasers, official trailers, or featurettes.
- **people / cast:** Individuals involved in the creation of the movie (Actors, Directors, Writers).
- **studios:** The production companies responsible for the movie (e.g., Warner Bros, A24).

## Taxonomy & Organization
- **genres:** Categories (e.g., Action, Horror).
- **collections:** Curated groups of movies (e.g., "Marvel Cinematic Universe", "Best of 2024").
- **countries:** Origin countries for movies.
- **languages:** Spoken languages in the movie.
- **tags:** Flexible, non-hierarchical descriptors (e.g., "mind-bending", "based on a true story").

## Content Management (CMS)
- **homepage_sections:** Defines the layout and ordering of rows on the homepage (e.g., Trending, Upcoming).
- **featured_items:** Items pinned to the hero carousel.

## Admin & Security
- **admin_users:** Staff accounts authorized to access the CMS.
- **roles:** Groupings of permissions (e.g., SuperAdmin, Editor).
- **permissions:** Granular access rights.
- **audit_logs:** A tamper-evident trail of who changed what and when.

## System & SEO
- **settings:** Global key-value pairs for site configuration (e.g., maintenance mode, global analytics tags).
- **seo_pages:** Custom SEO overrides (titles, meta descriptions) for static routes or specific entities.
- **media_assets:** A registry of uploaded files (custom posters, admin avatars) to prevent orphan files on the CDN.

## Telemetry
- **search_logs:** Records of user search queries to analyze trends and zero-result searches.
- **analytics_events:** Basic, privacy-friendly event tracking (e.g., trailer plays, outbound affiliate clicks).
