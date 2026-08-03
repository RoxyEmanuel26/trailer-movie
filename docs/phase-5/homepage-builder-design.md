# Homepage Builder Design

The homepage is the most important real estate on the site. Hardcoding it requires developer time; a dynamic builder empowers editors.

## 1. Section Architecture
The homepage is a vertical stack of "Sections".
The Admin UI provides a drag-and-drop list of these sections.

## 2. Section Types
When adding a new section, the admin selects a type:
- **Hero Video:** A massive auto-playing video facade (requires selecting exactly 1 movie).
- **Dynamic List:** A horizontal scrolling row (e.g., "Trending Now", "Upcoming Releases"). Driven by database queries.
- **Curated Collection:** A horizontal row driven by a manual list of specific movies.
- **Ad Slot / Promo:** A banner or external link.

## 3. Configuration Interface
Clicking a section opens a drawer/modal to configure it:
- **Title:** e.g., "Epic Sci-Fi Adventures".
- **Data Source:** (If Dynamic List) -> Select "Genre" -> "Sci-Fi". Sort by: "Release Date". Limit: 10.
- **Visibility Toggle:** Easily turn a section on or off without deleting it (useful for temporary holiday collections).

## 4. Preview and Publish
- Changes to the homepage structure are saved to a `draft` state in the `homepage_sections` table.
- A "Preview" button lets the admin see the layout.
- An explicit "Publish Layout" button pushes the changes live and clears the `/api/v1/homepage` CDN cache.
