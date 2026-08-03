# Content Safety and Recovery

Mistakes will happen. The admin architecture must prioritize making recovery trivial.

## 1. Soft Deletes (The Primary Safety Net)
- As designed in Phase 3, clicking "Delete" on a Movie or Genre does not remove the row from the database. It sets a `deleted_at` timestamp.
- **Recovery UI:** The admin panel includes a "Trash" view. Any user with appropriate permissions can view deleted records and click a "Restore" button to instantly bring the content back online, with all its relationships intact.

## 2. Version History / Rollbacks (Concept)
- By utilizing the `audit_logs` table (which stores `old_values` and `new_values` as JSON diffs), we can build a "History" tab on the Movie Edit screen.
- **Recovery UI:** An admin can view previous edits and, theoretically, click "Revert to this version" to automatically patch the current record with the historical JSON payload. (This is a complex feature, best reserved for Phase 2 of development).

## 3. The "Undo" Toast
- For non-critical actions (e.g., removing a tag from a movie, archiving a notification), the UI should immediately execute the action but display a toast notification in the corner: "Tag removed. [Undo]".
- Clicking Undo fires the reverse API call immediately, saving the user from navigating to a trash bin.
