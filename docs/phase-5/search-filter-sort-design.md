# Search, Filter, and Sort Design

The ability for admins to locate specific records quickly dictates the efficiency of the entire CMS.

## 1. Global Search (Command Palette)
- **Implementation:** A global `Cmd+K` (or `Ctrl+K`) omnibar accessible from anywhere in the admin panel.
- **Functionality:** Instantly searches movie titles, actor names, or admin sections. Clicking a result jumps directly to the Edit screen for that entity.

## 2. Table-Level Search and Filters
Every data table (e.g., the Movies list) must include:
- **Keyword Search:** Filters the current table by title or slug.
- **Status Filter:** Dropdown to show only `Drafts`, `Published`, or `Deleted` (Trash) records.
- **Taxonomy Filters:** Dropdowns to filter by `Genre` or `Release Year`.
- **Missing Data Filters (Crucial):** Toggles to show "Movies missing posters" or "Movies missing trailers." This is the most valuable tool for Content Editors.

## 3. Sorting
- Tables must support clicking column headers to sort.
- Default sort for Movies: `updated_at DESC` (showing the most recently worked-on files first).
- Other useful sorts: `release_date DESC`, `popularity DESC`.

## 4. State Persistence
- Filters, search queries, and pagination state must be preserved in the URL query string (e.g., `?status=draft&page=2`). This allows admins to share links to specific filtered views or refresh the page without losing their place.
