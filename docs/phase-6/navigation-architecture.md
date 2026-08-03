# Navigation Architecture

Navigation must be invisible when watching a trailer, but instantly accessible when browsing.

## 1. Header Navigation
- **Placement:** Fixed at the top of the viewport. Semi-transparent, turning solid on scroll.
- **Elements:**
  - Logo (Left) -> Links to `/`.
  - Links (Center): `Upcoming`, `Trending`, `Genres` (Dropdown menu).
  - Search Icon (Right).
- **Mobile:** Collapses into a standard hamburger menu.

## 2. Footer Navigation
- **Placement:** Bottom of every page.
- **Elements:**
  - **Column 1:** Top Genres (Sci-Fi, Action, Horror). Good for internal SEO linking.
  - **Column 2:** Quick Links (Upcoming, Trending, Top Rated).
  - **Column 3:** Legal & Trust (About, Privacy, Terms, DMCA).

## 3. Breadcrumbs
- **Placement:** Just above the Title on the Movie Detail page.
- **Format:** `Home > [Primary Genre] > [Movie Title]`
- **Why:** Essential for SEO (implements BreadcrumbList JSON-LD) and helps users navigate back to broad categories easily.
