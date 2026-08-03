# Route and Middleware Protection

Access control is enforced at the earliest possible entry point to save server resources.

## 1. Middleware Hierarchy
Requests pass through a conceptual funnel:
1. **Rate Limiter:** Drops excessive requests from a single IP.
2. **Auth Checker:** Verifies if the route requires a session cookie. If missing, redirects to `/login` or returns `401 Unauthorized`.
3. **Permission Checker:** Checks if the authenticated user has the specific `can('action')` permission for the requested route. If not, returns `403 Forbidden`.

## 2. Route Groups
- **Public Routes (`/`, `/api/v1/*`):** Skip the Auth and Permission checkers entirely.
- **Guest-Only Routes (`/admin/login`):** If an authenticated user hits this, they are redirected to the dashboard.
- **Admin-Only Routes (`/admin/*`, `/api/admin/*`):** Require valid Auth.
- **System Endpoints (`/api/system/*`):** Bypass user sessions. Require a highly secure Bearer token passed in the header (used for cron jobs).

## 3. Fall-Through Prevention
All new routes added to the `/admin` prefix must be secure by default. A developer should have to explicitly opt-out of auth middleware, preventing accidental exposure of new features.
