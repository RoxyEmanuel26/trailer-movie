# Routing and Page Map

The URL structure is flat, semantic, and highly optimized for SEO.

## Core Routes
- **`/`** - Homepage (Discovery).
- **`/movie/[slug]`** - Movie Detail & Trailer Page (e.g., `/movie/dune-part-two`).
- **`/genre/[slug]`** - Genre listing (e.g., `/genre/sci-fi`).
- **`/collection/[slug]`** - Curated collections (e.g., `/collection/marvel-cinematic-universe`).

## Discovery & Listing Routes
- **`/trending`** - Trending movies (Top visited/played this week).
- **`/upcoming`** - Movies releasing soon.
- **`/top-rated`** - Highest rated movies in the catalog.
- **`/search?q=query`** - Search results page.

## Static & Legal Routes
- **`/about`** - About the platform.
- **`/contact`** - Contact form/info.
- **`/privacy`** - Privacy Policy.
- **`/terms`** - Terms of Service.
- **`/dmca`** - Copyright takedown request information.

## URL Strategy & SEO
- We use `/movie/[slug]` rather than `/movie/[id]-[slug]` for cleaner URLs. The database will enforce unique slugs.
- We do not nest movies inside genres (e.g., avoiding `/genre/sci-fi/dune-part-two`) because a movie can have multiple genres, which would cause duplicate content penalties or canonicalization nightmares.
