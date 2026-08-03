# Bulk Content Workflow

## Managing Mass Operations

When managing thousands of movies, updating them one by one is impossible. Bulk operations are necessary but highly dangerous.

### Safety Checks Before Execution
- **The Golden Rule:** A bulk operation that touches more than 10 records must display a confirmation modal detailing exactly what will happen (e.g., "You are about to change the Genre of 250 movies to 'Sci-Fi'. This action cannot be easily undone.").
- **Long-Running Operations:** Bulk updates shouldn't block the UI. They should be pushed to a background queue, providing a progress bar or a notification upon completion.

### Supported Bulk Actions
- **Bulk Publish/Unpublish:** Selecting 50 drafted movies and publishing them simultaneously (often used after a bulk data import).
- **Bulk Taxonomy Assignment:** Adding a specific tag (e.g., "Summer Sale") to a selected list of movies.
- **Bulk Delete/Archive:** Moving old content out of the active database view.

### The "Dry Run" Concept
- For complex bulk updates (e.g., search and replace within synopses), the workflow should ideally offer a "Dry Run" or "Preview" mode, showing a sample of the records that will be affected before the actual database mutation occurs.

### Auditability
- Bulk operations must log a single, overarching event in the Audit Log detailing the scope, rather than flooding the log with 500 individual "movie updated" events, which makes the log unreadable.
