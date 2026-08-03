# Public Page Templates

## 1. Homepage Template
- **Hero Section (Top):** Features a massive 16:9 backdrop (or silent looping video on desktop) of the #1 trending movie. Includes the Title, a short tagline, and a primary "Watch Trailer" button.
- **Trending Row:** Horizontal scrolling carousel of movie posters (2:3) for what is currently popular.
- **Latest Additions:** Grid layout of the newest trailers added to the database.
- **Footer:** Links to genres, about, and legal pages.

## 2. Movie Detail Template
- **Top Section (The Theater):** 
  - Spans the full width of the container. 
  - The Trailer Facade (16:9) dominates the top.
  - The background behind the player is pure black (`#000000`) to create a theater-like contrast.
- **Middle Section (Metadata):**
  - Left Column (or Top on Mobile): The 2:3 Movie Poster.
  - Right Column (or Bottom on Mobile): Title, Release Date, MPAA Rating, Runtime, Genres. Followed by the Synopsis.
- **Bottom Section (Cast & Related):**
  - Cast members (horizontal avatars).
  - "More Like This" (horizontal poster carousel).

## 3. Genre / Search Listing Template
- **Header:** Clean typographic header stating the context (e.g., "Action Movies" or "Search Results for 'Batman'").
- **Content:** A strict, infinite-scroll or paginated grid of 2:3 movie posters.
- **Empty State:** If no results are found, display a friendly message with a search bar and a CTA to "Browse Trending".

## 4. Static Content Template
- **Usage:** Privacy Policy, About Us, Terms of Service.
- **Layout:** Narrow, single-column text layout (`max-w-prose` or `max-w-3xl`) centered on the screen for optimal reading line length.
