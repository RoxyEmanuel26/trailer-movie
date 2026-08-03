# Future Access Readiness

If the platform grows to support multiple distinct brands (e.g., a "Horror Trailers" site and an "Action Trailers" site powered by the same CMS), the auth model must be ready to scale into a multi-tenant architecture.

## 1. Tenant Separation
The simplest path to multi-tenancy is adding a `tenant_id` (or `site_id`) to both the `admin_users` table and the `movies` table.
- A user's role is scoped to a specific tenant.
- E.g., John is a `Content Editor` for `site_id = 1` but has no access to `site_id = 2`.

## 2. API Scope Evolution
Instead of just checking `can('update:movies')`, the middleware will evolve to check `can('update:movies', current_site_id)`. By relying on the granular permissions model designed in the MVP, this evolution does not require rewriting the core business logic, only the authorization middleware.
