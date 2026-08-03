# Phase 12 Decision Log

## Content Workflow Decisions

This document records the major structural and strategic decisions made during Phase 12 regarding content management workflows.

| Decision | Rationale | Trade-offs |
| :--- | :--- | :--- |
| **Draft/Publish Separation for Edits** | Editing a live movie creates a hidden Draft rather than modifying the live database record directly. This ensures public API responses never return a half-edited JSON payload. | Increases database complexity (needs a versioning or shadow-table strategy) compared to simple CRUD. |
| **Permissive Save, Strict Publish** | Editors can save drafts with missing data so they don't lose work if interrupted. However, the system physically blocks publishing if required fields are missing. | Requires building two distinct validation pipelines (Save vs. Publish) instead of one. |
| **Soft Deletion by Default** | "Delete" moves items to a Trash bin instead of wiping rows from the database. Prevents catastrophic accidental data loss. | Requires filtering out `deleted_at IS NOT NULL` on almost every public database query. |
| **No Mandatory Review for Movies** | Requiring a Senior Editor to approve every single movie addition slows down catalog growth unnecessarily. We rely on strict validation rules instead of human bottlenecks. | Slightly higher risk of a typo making it to the live site, which must be caught and fixed post-publish. |
| **Optimistic Locking for Concurrency** | Checking timestamps on save is less complex and less frustrating than Pessimistic Locking (where a user might lock a page and go to lunch, blocking everyone else). | If a conflict occurs, the second user must manually merge or re-enter their changes. |
