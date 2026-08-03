# Review and Approval Workflow

## Quality Control

For small teams, every editor having publish rights is efficient. For larger teams, a review layer prevents brand damage.

### Which Actions Require Review?
- **Standard Edits:** Fixing a typo or updating a synopsis does *not* require review. Velocity is prioritized.
- **High-Impact Actions:** Creating a brand new Genre, editing the Homepage structure, or launching a major promotional Collection triggers the review workflow.

### The Approval Flow
1. **Submission:** A junior editor finishes a Draft and clicks "Submit for Review" instead of "Publish".
2. **State Change:** The item moves to the `In Review` state. The original editor can no longer edit it while locked.
3. **Notification:** Senior Editors receive a notification.
4. **Action:** A Senior Editor views the Draft (using the secure preview).
   - **Approve:** They click "Approve & Publish" (item goes live).
   - **Reject/Revise:** They click "Request Changes", leave a required comment, and the item returns to the `Draft` state for the original editor to fix.

### Why Review is NOT needed for Movies
- In a trailer catalog, adding movies is a high-volume data entry task. Mandating a review for every single movie slows down the operation unacceptably. Quality control for movies should rely on Strict Validation Rules (blocking publish if data is missing) rather than manual human bottlenecking.

### Audit Traceability
- The audit log must record who submitted the item, who approved it, and when.
