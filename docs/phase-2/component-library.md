# Component Library

## Navigation Bar
- **Purpose:** Primary site navigation and search access.
- **Variants:** Transparent (over hero images, blends in), Solid (dark background for inner pages).
- **States:** Sticky on scroll (turns solid on scroll for readability).
- **Responsive:** Collapses to hamburger menu + search icon on tablet/mobile.

## Movie Card (Poster Grid)
- **Purpose:** Primary unit for displaying a movie in a list/grid.
- **Variants:** Standard (Poster + Title + Year), Compact (Poster only, title on hover - use sparingly).
- **States:** 
  - *Hover:* Slight scale up (1.05x), shadow increase, play icon overlay appears.
  - *Loading:* Skeleton box matching 2:3 aspect ratio.
- **Spacing:** `16px` gap between cards in a grid.

## Trailer Card (Video Thumbnail)
- **Purpose:** Used when displaying a list of videos (e.g., "More trailers for this movie").
- **Variants:** 16:9 thumbnail with play button overlay. Text metadata below or beside.
- **States:** 
  - *Hover:* Play button accent color glow, thumbnail slight dimming.

## Genre Chip / Tag
- **Purpose:** Clickable pill shape to navigate to genre pages.
- **Variants:** Active (Primary color background), Inactive (Surface Level 1 background).
- **States:** *Hover:* Surface Level 2 background.

## Button Variants
- **Purpose:** Trigger actions (Play, View Details, Save).
- **Variants:**
  - *Primary:* Solid Brand Red. Used for "Play Trailer".
  - *Secondary:* Outline or Surface Level 2. Used for "More Info" or Admin actions.
  - *Ghost:* No background until hover. Used for tertiary actions.
- **Spacing:** Padding X: `24px`, Padding Y: `12px` (Large), `8px` (Small).

## Hero Section
- **Purpose:** Showcase the most important upcoming or trending movie.
- **Variants:** Full Bleed (edge-to-edge backdrop), Contained (rounded corners within the max-width grid).
- **States:** Auto-playing silent background video (desktop only) with gradient overlay at the bottom to ensure text readability.

## Skeleton Loader
- **Purpose:** Graceful degradation while data fetches.
- **Variants:** Poster shape (2:3), Video shape (16:9), Text line.
- **Animation:** Subtle horizontal shimmer effect using Surface Level 1 and 2 colors.

*(Other standard components like Modals, Dropdowns, Toast Alerts, and Admin Form Fields follow standard Material/Tailwind best practices, utilizing the predefined Color and Typography systems).*
