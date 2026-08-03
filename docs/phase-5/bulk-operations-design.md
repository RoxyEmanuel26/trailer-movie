# Bulk Operations Design

Bulk operations are necessary for managing catalogs with thousands of entries, but they carry significant risk.

## Supported Operations
- **Bulk Publish/Unpublish:** Select multiple movies and change their status simultaneously.
- **Bulk Tag/Genre Assignment:** Select 50 movies and add the "Sci-Fi" genre to all of them.
- **Bulk TMDB Sync:** Select outdated movies and trigger a forced refresh.

## Safety Rules & Guardrails
1. **Limits:** Bulk operations are hard-capped at 100 items per batch to prevent database locking and PHP/Node memory exhaustion.
2. **Confirmation:** Clicking a bulk action triggers a modal: "You are about to modify 45 records. This cannot be easily undone. Proceed?"
3. **Background Processing:** If a bulk action requires external API calls (like Bulk TMDB Sync), it must NOT block the UI. It dispatches a background job, and the admin sees a progress bar or receives a notification when complete.
4. **Audit Grouping:** Bulk operations must be logged in the `audit_logs` table with a shared `batch_id` so the entire operation can be identified later if a rollback is needed.
