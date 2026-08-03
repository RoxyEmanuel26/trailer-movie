# Layout System

## Grid Structure
The application utilizes a responsive 12-column grid system.
- **Gutter Width:** `1.5rem` (24px) on desktop, `1rem` (16px) on mobile.
- **Columns:** 12 (Desktop), 8 (Tablet), 4 (Mobile).

## Container Widths
To maintain readability and structural integrity on ultrawide monitors, content is constrained within a maximum width.
- **Max Container Width:** `1440px` (or `max-w-7xl` in Tailwind terms).
- **Hero/Backdrops:** May break out of the container to span `100vw` for a cinematic feel.

## Spacing Scale
Follow a strict 4px baseline grid for padding, margin, and gaps.
- `4px` (0.25rem) - Micro adjustments
- `8px` (0.5rem) - Inner component padding (e.g., inside a button)
- `16px` (1rem) - Standard gap between related items (e.g., elements in a card)
- `24px` (1.5rem) - Standard padding for containers/cards
- `32px` (2rem) - Spacing between distinct subsections
- `64px` (4rem) - Standard section spacing (e.g., gap between "Trending" and "Upcoming" rows)
- `96px` (6rem) - Hero section padding / Major page dividers

## Breakpoints
Mobile-first approach.
- **Mobile (sm):** Default up to `640px`
- **Tablet (md):** `641px` - `1024px`
- **Desktop (lg):** `1025px` - `1280px`
- **Ultrawide (xl):** `1281px`+

## Responsive Behavior Rules
1. **Grids to Carousels:** On mobile, 4-column desktop grids (e.g., movie posters) should gracefully collapse into horizontal scrolling carousels with CSS snap-points. This prevents endless vertical scrolling.
2. **Hidden Navigation:** Complex top navigations must collapse into a minimal Hamburger menu on Tablet and Mobile.
3. **Hero Constraints:** Hero sections must adjust aspect ratios on mobile to ensure the play button remains above the fold.
