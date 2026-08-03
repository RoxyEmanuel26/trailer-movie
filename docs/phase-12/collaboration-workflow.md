# Collaboration Workflow

## Working Together Without Stepping on Toes

As the editorial team scales, the system must prevent users from overwriting each other's work.

### Concurrent Edit Detection (Optimistic Locking)
- The simplest and most effective method.
- When User A opens a document, they receive the current `version_token` (or `updated_at` timestamp).
- When User A attempts to save, the backend checks if the database's current token matches User A's token.
- If User B saved in the meantime, the tokens won't match, and User A's save is blocked with a clear warning.

### Edit Locking (Pessimistic Locking - Optional)
- For highly critical documents (like the Homepage structure), the system can implement an explicit lock.
- When User A opens the Homepage editor, the system locks it. If User B tries to open it, they see: "This page is currently being edited by User A. It is read-only."
- Locks must have timeouts (e.g., 30 minutes) to prevent a user from locking a page indefinitely if they close their laptop.

### Draft Ownership and Handoff
- A Draft is visible to all editors, not just the creator.
- A Junior Editor can create a Draft, flesh out the metadata, and then paste the internal CMS URL into Slack for a Senior Editor to review, refine, and hit Publish.

### Conflict Resolution Behavior
- If a concurrent edit block occurs, the system should not just discard the user's input. It should ideally keep the user's unsaved form data visible in the browser, allowing them to copy their work to a notepad, refresh the page to get the latest version, and re-apply their edits safely.
