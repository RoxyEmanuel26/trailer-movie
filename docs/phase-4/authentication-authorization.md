# Authentication & Authorization

## Public API Access
- **Authentication:** None required. All public endpoints (GET requests) are fully anonymous.
- **Protection:** Protected purely via Rate Limiting (e.g., max 100 requests per minute per IP via Nginx/Cloudflare) and CORS policies (only allowing requests from the official frontend domain).

## Admin API Access (CMS)
- **Authentication Strategy:** Stateless JWT (JSON Web Tokens) or secure, HTTP-only session cookies. Given modern SSR frameworks (like Next.js), HTTP-only cookies are preferred as they prevent XSS attacks from stealing tokens.
- **Authorization (RBAC):** 
  - Every admin route must pass through an authorization middleware.
  - The middleware verifies the user's `role_id` and checks the `permissions` table.
  - Example: A user with an "Editor" role can access `POST /api/admin/movies` but will receive a `403 Forbidden` if they attempt to access `GET /api/admin/users`.

## Internal Cron/System Access
- **Authentication:** Long-lived, highly entropic static bearer tokens passed in the `Authorization: Bearer <TOKEN>` header.
- **Authorization:** Only allowed to hit specific `/api/system/*` routes. Ideally, also protected by IP allow-listing (e.g., only accepting requests from Vercel/GitHub Actions IPs).
