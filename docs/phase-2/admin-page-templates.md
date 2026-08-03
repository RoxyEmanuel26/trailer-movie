# Admin Page Templates

## 1. Admin Layout Structure
- **Sidebar (Left):** Vertical navigation containing links to Dashboard, Movies, Genres, Settings. Fixed position on desktop. Collapses behind a hamburger menu on mobile.
- **Top Bar:** Breadcrumbs indicating current location, User Profile dropdown, and quick "Add New" button.
- **Main Content Area (Right):** The primary workspace. Uses a lighter background than the public site (e.g., `#1A1A1A` instead of `#0F0F0F`) to differentiate the workspace from the presentation layer.

## 2. Listing Page Template (e.g., Movies List)
- **Header:** Title (e.g., "All Movies") and a prominent primary "Create New" button.
- **Filters/Search:** A bar above the table to search by title or filter by status (Published, Draft).
- **Data Table:**
  - Columns: Thumbnail, Title, Release Date, Status Badge, Actions (Edit/Delete).
  - Row Hover: Highlights the entire row for better tracking.
- **Pagination:** Standard numbered pagination at the bottom.

## 3. Create / Edit Form Template
- **Layout:** Single-column stacked form for simplicity, or two-column (Main data left, metadata/status right) on large screens.
- **Sections:** Group related inputs within Surface Level 1 cards (e.g., "Basic Info", "Media URLs", "SEO Meta").
- **Sticky Footer (Optional):** "Save" and "Cancel" buttons that remain visible at the bottom of the viewport so the user doesn't have to scroll all the way down to save a long form.

## 4. Dashboard Template
- **Metrics Row:** 3-4 simple summary cards at the top (Total Movies, Published Trailers, Genres).
- **Recent Activity:** A list or table showing the last 5 edited movies.
