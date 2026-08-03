# Trailer Page Architecture

## Unified Architecture (No Separate Trailer Pages)
We will **not** use separate trailer pages (e.g., `/movie/dune/trailer-1`). 
- **Why:** Separating trailers from the main movie page dilutes SEO value. We want all backlinks and social shares to point to the central `/movie/[slug]` page.

## Trailer Behavior on the Movie Page
- **Primary Trailer:** The most recent or "Official" trailer occupies the main video player above the fold.
- **Secondary Trailers:** Listed below the fold as thumbnail cards.
- **Interaction:** Clicking a secondary trailer thumbnail does **not** load a new URL. Instead, it dynamically swaps the YouTube ID in the main video player and auto-plays the new trailer.
- **SEO Benefit:** This keeps users on the page longer (decreasing bounce rate) and consolidates all authority into a single URL.
