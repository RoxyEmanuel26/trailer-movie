# Lifecycle Model

## Content State Transitions

All major content items (primarily Movies and Collections) flow through a strictly defined state machine to ensure content is never published prematurely.

### States

- **Draft:** The item is being worked on. It is saved in the database but is invisible to the public API/frontend.
- **In Review (Optional):** The item is complete but awaits approval from a Senior Editor. 
- **Scheduled:** The item is approved and set to automatically transition to Published at a specific future timestamp.
- **Published:** The item is live and visible to the public.
- **Unpublished (Hidden):** A previously published item that has been temporarily removed from public view but remains fully intact in the CMS for easy restoration.
- **Archived:** The item is retired. It is removed from the public view and hidden from default CMS search results to declutter the workspace, but the data is preserved.
- **Soft Deleted:** The item is marked for deletion and moved to a "Trash" bin. It can be restored within a specific window (e.g., 30 days).
- **Hard Deleted:** The item is permanently wiped from the database. (Typically requires Super Admin access and is rarely used).

### State Transitions

- **Create -> Draft:** Triggered when a user clicks "New Movie".
- **Draft -> Published:** Triggered by "Publish" action (must pass validation).
- **Draft -> Scheduled:** Triggered by "Schedule" action with a valid future date.
- **Published -> Draft (Edit):** When a published item is edited, a *new* Draft revision is created. The Published version remains live until the Draft revision is explicitly published, replacing it.
- **Published -> Unpublished:** Triggered by "Unpublish" action. Immediate effect.
- **Any State -> Soft Deleted:** Triggered by "Delete" action.
- **Soft Deleted -> Draft (Restored):** Triggered by "Restore" action from the Trash.
