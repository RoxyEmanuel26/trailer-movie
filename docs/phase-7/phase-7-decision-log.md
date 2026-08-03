# Phase 7 Decision Log

This document records the major architectural choices made regarding security.

## DECISION 001: Separation of Admin and Public Users
- **Decision:** The system will use two entirely separate database tables (`admin_users` and `users`) rather than a single table with an `is_admin` boolean flag.
- **Reasoning:** A single table risks catastrophic privilege escalation bugs (e.g., a public user manipulating a signup form payload to set `is_admin = true`). Separate tables require separate authentication guards, providing a hard physical boundary.
- **Trade-off:** Requires configuring two separate auth flows and guards in the backend framework.

## DECISION 002: Roles vs Permissions in API Logic
- **Decision:** The API business logic will check specific Permissions (e.g., `can('delete:movie')`), not Roles (e.g., `is('editor')`). Roles are only used as containers to assign groups of permissions to users.
- **Reasoning:** If business requirements change (e.g., Editors are no longer allowed to delete movies), we only change the database definition of the "Editor" role. We do not have to deploy new code.
- **Trade-off:** Slightly more complex initial database design (requires `roles`, `permissions`, and `role_permission` pivot tables).

## DECISION 003: HTTP-Only Cookies over LocalStorage JWTs
- **Decision:** Admin sessions will use HTTP-Only cookies rather than returning a JWT in the response body to be stored in the browser's `localStorage`.
- **Reasoning:** Any third-party JavaScript running on the admin dashboard (e.g., an analytics script) can read `localStorage` and steal a JWT (XSS attack). HTTP-Only cookies are invisible to JavaScript.
- **Trade-off:** Requires implementing CSRF protection if the API and Frontend exist on different domains/subdomains.

## DECISION 004: Invitation-Only Admin Creation
- **Decision:** There is no `/admin/register` route. Admins can only be created via invitation from a Super Admin.
- **Reasoning:** Reduces the attack surface to zero for unauthorized account creation.
- **Trade-off:** Onboarding a new hire requires manual intervention from an existing Super Admin.
