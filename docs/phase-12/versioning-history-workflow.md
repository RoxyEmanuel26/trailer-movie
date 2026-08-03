# Versioning and History Workflow

## The Undo Button for Content

The ability to look back and revert changes gives editors the confidence to work quickly.

### Revision Snapshots
- Every time a `Published` item is updated, the previous state is saved as a discrete `Revision` record in the database.
- These revisions act as a complete snapshot of the content (title, synopsis, assigned trailers, etc.) at that specific moment in time.

### Change History
- The CMS UI provides a "History" tab for major entities (Movies, Homepage).
- This view lists previous revisions, showing:
  - Timestamp of the change.
  - The Admin user who made the change.

### Before/After Comparison (Conceptual)
- While a full visual diff tool is complex, a simple text comparison showing what fields changed between Revision A and Revision B helps editors understand why a change was made.

### Rollback Behavior
- **Action:** An editor realizes the new synopsis published yesterday was entirely wrong. They go to the History tab, select yesterday's revision, and click "Rollback."
- **Result:** The system creates a *new* Draft based on the old revision's data. The editor can then review this restored data and Publish it, effectively undoing the mistake safely.

### Version Retention Expectations
- Storing every single save can bloat the database.
- **Policy:** Retain the last 10 published revisions indefinitely. Older revisions can be automatically pruned to save space, as rollbacks are rarely needed for changes made years ago.
