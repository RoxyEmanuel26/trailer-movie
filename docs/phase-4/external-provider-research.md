# External Provider Research

This document outlines the external services the platform will likely interact with to function efficiently.

## 1. Movie Metadata Provider (TMDB - The Movie Database)
- **Role:** Supplies the baseline data to avoid manual data entry.
- **Data Supplied:** Titles, release dates, runtime, synopsis, cast lists, genres, poster/backdrop URLs.
- **Why it is useful:** It is the industry standard for community-curated movie metadata with an excellent, free API.
- **Limitations/Risks:** Rate limits (typically ~40-50 requests per second). Data can sometimes be altered by rogue community edits (hence our "Locked Fields" pattern).
- **Protection Strategy:** Abstracted behind `TmdbProvider` interface. If we switch to OMDB or IMDB APIs later, only the provider implementation changes, not the core `SyncService`.

## 2. Trailer/Video Provider (YouTube Data API v3)
- **Role:** Used to verify trailer URLs, fetch video durations, and fallback thumbnails.
- **Data Supplied:** Video existence status (404, Private), duration, high-res thumbnail URL.
- **Why it is useful:** Essential for our nightly link-checker cron job to ensure we aren't displaying broken trailers.
- **Limitations/Risks:** Strict quota limits (10,000 units per day). A `videos.list` request costs 1 unit. We must batch requests.
- **Protection Strategy:** Batch queries up to 50 IDs per request. Cache responses heavily.

## 3. Image CDN / Storage Provider (AWS S3 / Cloudflare R2 / Cloudinary)
- **Role:** Hosts our custom-uploaded assets (Admin avatars, custom posters).
- **Data Supplied:** Fast, edge-cached image delivery.
- **Why it is useful:** Offloads bandwidth from our application server. Cloudinary specifically offers on-the-fly cropping/resizing.
- **Limitations/Risks:** Egress costs (mitigated heavily by using Cloudflare R2 or a CDN in front of S3).

## 4. Optional: Search Provider (Algolia / Meilisearch)
- **Role:** Provides typo-tolerant, lightning-fast full-text search.
- **Data Supplied:** Movie search results.
- **Why it is useful:** Standard SQL `LIKE` queries become too slow and rigid at scale.
- **Protection Strategy:** The application will trigger updates to the search index asynchronously via background queues when a movie is published or updated, preventing the main request from blocking.
