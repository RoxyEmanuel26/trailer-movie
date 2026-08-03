# Taxonomy Management Workflow

## Organizing the Catalog

Taxonomies (Genres, Tags, Collections) define how the site is navigated. Changing them has wide-ranging impacts.

### Create and Edit
- Only users with the Taxonomy Manager or Senior Editor role can create or edit core Genres.
- Standard fields: `name`, `slug`, `description` (for SEO), and an optional `hero_image`.

### Safe Reassignment and Deletion
- Deleting a Genre (e.g., "Action") is highly dangerous because it might leave hundreds of movies uncategorized or break the public `/genre/action` URL.
- **Workflow:** 
  - Standard deletion is blocked if the Genre has attached movies.
  - The editor must use a "Merge & Delete" or "Reassign" tool: "Move all 500 movies currently in 'Action' to 'Adventure', then delete 'Action'."

### Hiding/Archiving Taxonomy
- Rather than deleting, an editor can set a Genre to `Hidden`.
- **Result:** Movies keep the tag internally, but the Genre disappears from public navigation menus and filter lists. The `/genre/action` URL may return a 404 or redirect.

### Collection Management
- Collections (e.g., "Summer Blockbusters") are highly editorial.
- **Workflow:** Editors create a Collection, define its metadata, and then use a drag-and-drop or search-to-select interface to curate the exact list and order of movies within that collection.
