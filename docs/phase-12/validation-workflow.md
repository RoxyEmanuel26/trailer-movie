# Validation Workflow

## Preventing Bad Data

Validation is the first line of defense against a broken frontend. It must be strict but communicative.

### Publish-Blocking Errors vs. Warnings
- **Error (Blocks Publish):** "Primary Poster is missing." "Title cannot be blank." The action is aborted.
- **Warning (Allows Publish):** "Meta Description is empty (will use auto-fallback)." "No related movies selected." The action proceeds, but the editor is informed they are publishing sub-optimal content.

### Required Field Checks
- Enforced strictly at the database schema level and the API payload level before the Publish action commits.

### Slug Checks and Duplicate Detection
- When generating a slug, the system must query the database to ensure it is unique. If a collision occurs (e.g., a remake with the same title), the workflow must automatically append a differentiator (e.g., `the-matrix-2021`) or prompt the user to resolve it.

### Asset Validation
- Enforcing minimum dimensions for uploaded images. If an editor uploads a 100x100px thumbnail as a Hero Backdrop, the workflow rejects the upload immediately to prevent the frontend from stretching it to look terrible.

### Relationship Validation
- Before deleting a Genre, validate that no movies are currently attached to it. If there are, block the deletion and require the editor to reassign them first.

### Clear Feedback
- Validation failures must highlight the exact field in the UI that caused the error. Generic "Save Failed" messages are unacceptable in a modern workflow.
