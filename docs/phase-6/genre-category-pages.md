# Genre and Category Pages

Genre pages (`/genre/[slug]`) act as discovery hubs and are critical for capturing broad SEO search intent (e.g., "best sci fi movie trailers").

## Page Structure

### 1. The Header
- **H1 Title:** "Sci-Fi Movie Trailers" (Dynamically constructed: `{Genre.Name} Movie Trailers`).
- **SEO Description:** A short, SEO-optimized paragraph introducing the genre.

### 2. The Content Grid
- A standard responsive grid (2 columns on mobile, 4 on tablet, 6 on desktop) of movie posters.
- Each poster card shows the title, release year, and a small play icon overlay.

### 3. Controls (Filters & Sorting)
- Above the grid, users must have options to filter by:
  - **Release Year:** (e.g., 2024, 2023).
  - **Sort By:** "Newest First", "Most Popular".
- Changing a filter should dynamically update the grid (via API) but ideally also update the URL parameters (`?year=2024`) so the specific filtered view can be shared or linked.

### 4. Pagination vs. Infinite Scroll
- **Decision:** Use a "Load More" button (which appends results) rather than strict pagination (Page 1, 2, 3) or aggressive auto-infinite scroll.
- **Why:** "Load More" provides the UX benefits of infinite scroll but allows users to actually reach the website footer to access legal/contact links.
