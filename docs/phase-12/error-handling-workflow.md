# Error Handling Workflow

## Recovering Gracefully

When the CMS encounters a system failure, it must protect the user's data and provide clear next steps.

### Save Failures
- **Scenario:** Database connection drops while an editor is writing a long synopsis.
- **Handling:** The CMS must intercept the 500 API error. It must *not* crash the browser tab or lose the entered text. It should display a toast: "Failed to save. Retrying..." and keep the form data intact in the browser state until the connection recovers.

### Publish Failures
- **Scenario:** Validation passes, but the cache invalidation service is down.
- **Handling:** The database transaction should commit (the item is officially Published), but the UI should warn: "Published successfully, but caching delayed. Changes may take 5 minutes to appear on the public site."

### Sync Failures
- **Scenario:** The TMDB API is down when an editor tries to "Quick Add" a movie by ID.
- **Handling:** The workflow fails gracefully with a message: "External metadata service is unavailable. Please try again later or enter data manually."

### Concurrent Edit Handling (Conflict Detection)
- **Scenario:** Editor A and Editor B both open the same Draft. Editor A saves. Editor B tries to save 5 minutes later.
- **Handling:** The system must detect this via an `updated_at` timestamp check or optimistic concurrency control. Editor B's save is blocked.
- **Message:** "This document was modified by another user while you were editing. Please refresh to see their changes." (Prevents Editor B from overwriting Editor A's work).
