# Phase 6 Decision Log

This document records the major architectural decisions and trade-offs made during the public website design phase.

## DECISION 001: Consolidating Trailers into the Movie Detail Page
- **Decision:** We will not have routes like `/movie/dune/trailer-1`. All trailers belong to the `/movie/dune` page.
- **Reasoning:** A single authoritative URL per movie is vastly superior for SEO and link-building. Splitting them dilutes page authority and confuses users.
- **Trade-off:** The Movie Detail page becomes heavier. The UI must elegantly handle swapping the active video player if a movie has 5+ trailers.

## DECISION 002: "Video Facades" over Native Embeds
- **Decision:** The initial page load will *never* load the actual YouTube iframe. It will load a static WebP thumbnail with a fake play button overlaid. Clicking it injects the iframe and auto-plays.
- **Reasoning:** Loading a YouTube iframe downloads ~500kb of JS and drastically lowers Google Lighthouse performance scores. A facade loads in milliseconds.
- **Trade-off:** Requires custom client-side javascript to handle the swap and state management.

## DECISION 003: "Load More" over Standard Pagination or Infinite Scroll
- **Decision:** Genre and search results pages will use a manual "Load More" button to append results to the grid.
- **Reasoning:** True infinite scroll prevents users from ever reaching the footer (where our legal links live). Standard pagination (Page 1, 2, 3) requires a full page reload which feels clunky on modern SPA sites. "Load More" is the perfect middle ground.
- **Trade-off:** Less aggressive content discovery than infinite scroll; requires an explicit user action to see more.

## DECISION 004: Dark Mode Exclusive
- **Decision:** The site will not offer a light mode toggle. It is strictly dark mode.
- **Reasoning:** Trailer sites are entertainment hubs. Dark mode mimics a movie theater, makes colorful poster art pop, and significantly reduces the CSS overhead required to maintain two complete color themes.
- **Trade-off:** A tiny subset of users who force light-mode for accessibility reasons might complain, though this is rare for media consumption sites.
