# Content Recovery Strategy

## Fixing Editorial Mistakes

The most common "disaster" is not a cloud outage, but an editor making a mistake. The CMS must provide guardrails to prevent this from requiring a database-level restore.

### 1. Accidental Deletion (Soft Deletes)
- **Prevention:** When an admin clicks "Delete" on a movie, the record is not dropped from the database. A `deleted_at` timestamp is set (Phase 12).
- **Recovery:** The editor navigates to the "Trash" view in the CMS and clicks "Restore." The record is immediately active again. No IT intervention is required.

### 2. Unpublish / Archive Reversal
- Similar to soft deletes, changing a movie from "Published" to "Archived" is a simple state change. Reversing it is a single click in the CMS.

### 3. Overwritten Data (Revision History)
- **Scenario:** An editor accidentally pastes the synopsis for "Star Wars" into the "Star Trek" movie record and hits Save.
- **Recovery:** The CMS relies on the Versioning/History system (Phase 12). The editor views the history log for the movie, selects the version from 2 hours ago, and clicks "Revert."

### 4. Bulk Action Rollback
- **Scenario:** An editor accidentally applies the "Horror" genre to 500 family movies using a bulk edit tool.
- **Recovery:** Bulk actions must generate a single "Job ID." The CMS should provide an "Undo Bulk Action" feature that reverses the specific state changes associated with that Job ID. If this is not implemented, it requires a surgical database query from an engineer using the PITR logs.
