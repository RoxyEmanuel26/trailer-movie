# API Security

## Protecting the Interfaces

The API is the primary attack surface. It must be defended against both unauthorized access and authorized abuse.

### Public vs Authenticated Endpoint Rules
- Explicitly define every route as either public (requiring no auth) or private (requiring a valid session/token).
- Default to private if in doubt.
- Public endpoints (like fetching the homepage movie list) must be strictly read-only and aggressively cached.

### Admin-Only Endpoint Rules
- Any endpoint that creates, updates, or deletes data MUST require a valid session belonging to an admin user.
- The endpoint must then verify the specific role (RBAC) of that admin before executing the action.

### Rate Limiting by Route Type
- **Public Read APIs:** Moderate rate limiting (e.g., 100 requests per minute per IP) to prevent aggressive scraping while allowing normal browsing.
- **Admin Read APIs:** Higher limits, but still capped.
- **Write APIs (Mutations):** Strict rate limiting (e.g., 20 requests per minute per user) to prevent rapid automated tampering or spam.
- **Auth APIs (Login/Reset):** Extremely strict rate limiting (e.g., 5 requests per 15 minutes per IP).

### Payload Size Limits
- Set strict maximum limits on the size of incoming JSON payloads (e.g., 100KB) to prevent Denial of Service (DoS) attacks via memory exhaustion.

### Request Validation at API Boundary
- Validate the schema of every incoming request body, query parameter, and path variable. Reject malformed requests immediately with a generic 400 Bad Request error.

### Error Message Hygiene
- Never leak stack traces, database schema details, or underlying infrastructure information in API error responses.
- Return generic error messages to the client (e.g., "Invalid input" or "Internal Server Error") while logging the detailed error securely on the server.

### Internal Endpoint Protection
- If the architecture uses microservices or internal background jobs, endpoints meant only for internal communication must not be exposed to the public internet (use VPC routing or internal authentication tokens).

### Abuse Detection for Public APIs
- Monitor logs for unusual access patterns on public endpoints (e.g., sequentially requesting movie IDs 1 through 10,000 in a few seconds). Implement automated blocks for such IPs.
