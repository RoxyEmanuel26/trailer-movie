# Database Philosophy

## Core Architecture Approach
The database architecture for this movie trailer platform follows a hybrid model: we rely on a normalized relational database (e.g., PostgreSQL or MySQL) as the absolute source of truth for the application state, augmented by external API synchronization for baseline data to avoid massive manual data entry.

## Source of Truth
1. **Local Database is Authoritative:** While we may import data from external sources (like TMDB), the local database is the final source of truth for rendering the public website. If a local admin overrides a synopsis, the local change wins.
2. **Admin Overrides:** We use a "dirty flag" or "locked field" pattern. If an admin manually edits a field that was originally synced from an API, that specific field is flagged as locked and will never be overwritten by future automated syncs.

## Data Storage Strategy
- **Stored Locally:** All relational data (Movies, Trailers, Genres, Cast), SEO metadata, Admin user accounts, and layout configurations.
- **Synced from External APIs (TMDB/OMDB):** Initial movie metadata (release dates, standard synopses, cast lists, poster URLs).
- **Derived Data:** Data like `average_rating` (future), `total_trailers`, or `trending_score` should be calculated via background jobs or triggers and stored locally to avoid expensive queries during public page loads.
- **Cached Data:** The output of complex queries (e.g., "Top 10 Trending Movies this week") must be cached in memory (e.g., Redis) to guarantee sub-100ms response times for the public frontend.

## Normalization vs. Denormalization
- We start with a highly **normalized** design (3NF) to ensure data integrity.
- We selectively **denormalize** read-heavy data. For example, storing an array of genre names directly on the `movies` table (in a JSON column) is acceptable if it prevents a heavy 3-table join on the most trafficked page (the homepage), provided the source of truth remains in the `movie_genre` pivot table.
