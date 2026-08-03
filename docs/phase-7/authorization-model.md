# Authorization Model

The authorization system operates on a dual-layer approach: Roles and Permissions.

## 1. Role-Based Access Control (RBAC)
- A **Role** is a collection of permissions (e.g., `Content Editor`).
- Users are assigned roles, not individual permissions. This simplifies onboarding (e.g., assigning a new hire the "SEO Editor" role grants them exactly what they need instantly).

## 2. Permission-Based Action Checks
- Under the hood, the API layer checks **Permissions**, not Roles. 
- Example: Instead of `if (user.role == 'editor')`, the code uses `if (user.can('update:movies'))`.
- **Why?** If the business logic changes (e.g., SEO Managers are now allowed to update movies), we simply add the `update:movies` permission to the SEO Manager role in the database. No API code needs to change.

## 3. Route & Action Protection
- **Route-Level:** Middleware checks if the user has the required permission to even load the page or hit the API endpoint.
- **Field-Level (Resource Level):** For complex roles (like SEO Editor), they might have `update:movies`, but the API Service layer must enforce that they can *only* mutate the `meta_title` and `meta_description` fields, dropping any attempts to change the `release_date`.
