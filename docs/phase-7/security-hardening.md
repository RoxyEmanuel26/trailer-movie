# Security Hardening

The baseline configuration to protect the application at the protocol layer.

## 1. Cookie Hardening
If sessions are managed via cookies, they MUST be configured with:
- `HttpOnly: true` (Prevents JavaScript access to mitigate XSS).
- `Secure: true` (Ensures the cookie is only sent over HTTPS).
- `SameSite: Lax` or `Strict` (Prevents the cookie from being sent in cross-site requests, mitigating CSRF).

## 2. CSRF Protection
If the API uses cookie-based authentication, Cross-Site Request Forgery (CSRF) protection is mandatory.
- Every state-changing API request (`POST`, `PUT`, `DELETE`) must include a CSRF token in the headers (`X-CSRF-TOKEN`), matching a token set in a non-http-only cookie or provided in the initial HTML payload.

## 3. Secret Management
- Passwords are never logged.
- The `SESSION_SECRET` or `JWT_SECRET` must be a high-entropy string (e.g., generated via `openssl rand -hex 32`) stored exclusively in the `.env` file of the production server, never committed to version control.
