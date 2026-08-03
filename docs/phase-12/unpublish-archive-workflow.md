# Unpublish and Archive Workflow

## Removing Content Safely

Content removal must be deliberate and easily reversible to prevent catastrophic data loss from accidental clicks.

### Unpublish Behavior
- **Action:** Changes state from `Published` to `Unpublished`.
- **Result:** The content is immediately removed from public API responses and frontend views. The URL will return a 404 (or ideally, a 410 Gone or a 301 Redirect to a category page, depending on SEO strategy).
- **CMS View:** The item remains fully visible and editable in the main CMS lists, marked clearly as "Hidden/Unpublished."

### Archive Behavior
- **Action:** Changes state to `Archived`.
- **Result:** Same public result as Unpublish. However, in the CMS, the item is removed from default list views (to reduce clutter) and only appears if the editor specifically filters for "Archived" items. Used for seasonal or obsolete content.

### Soft Delete (Trash) Behavior
- **Action:** Clicking "Delete".
- **Result:** The `deleted_at` timestamp is set (Soft Delete). The item is completely removed from public view and standard CMS views. It is moved to a dedicated "Trash" UI.
- **Cascade:** Associated lightweight relationships (e.g., genre tags) remain intact on the soft-deleted record so it can be restored perfectly.

### Restore and Recovery
- Editors can navigate to the "Trash", select a soft-deleted item, and click "Restore."
- The item returns to the `Draft` or `Unpublished` state (never directly to `Published` to ensure it is reviewed before going live again).

### SEO Implications
- The workflow should prompt the editor: "You are unpublishing a live page. Would you like to create a 301 Redirect to another movie or genre?" to preserve SEO equity.
