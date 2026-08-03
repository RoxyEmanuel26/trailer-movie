# Publish Workflow

## Making Content Public

The publish workflow is the gatekeeper of quality. It controls the transition from Draft to Published.

### Pre-Publish Checks (Strict Validation)
Before the system accepts a "Publish" command, it must validate the content against the "Ready for Production" schema:
- Must have a `title` and a valid `slug`.
- Must have a primary `poster` image assigned.
- Must have at least one valid `trailer` assigned.
- Must belong to at least one `genre`.
- If any check fails, the publish action is blocked, and the editor is presented with a clear list of missing requirements.

### Publish Immediately
- If validation passes, the `Draft` revision overwrites the `Published` state.
- The `updated_at` timestamp is refreshed.
- **Cache Invalidation:** The CMS fires an event to the caching layer (e.g., Redis, CDN) to invalidate the specific movie route, the homepage, and relevant genre category pages so the new content appears immediately.

### Schedule Behavior
- Editor selects a future date and time.
- The item enters the `Scheduled` state.
- A background worker (e.g., a cron job checking every minute) monitors Scheduled items. When the time arrives, the worker executes the standard Publish workflow (including validation and cache invalidation).

### Publish Success and Failure
- **Success:** User receives a toast notification with a link to view the live page.
- **Failure:** If the database write fails or a network timeout occurs, the user receives an error, and the content remains safely in Draft state.
