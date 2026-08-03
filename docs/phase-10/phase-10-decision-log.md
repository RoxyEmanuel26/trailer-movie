# Phase 10 Decision Log

## Security Architecture Decisions

This document records the major structural and strategic decisions made during Phase 10 to ensure application security.

| Decision | Rationale | Trade-offs |
| :--- | :--- | :--- |
| **Server-Side Session/Secure HTTP-Only Cookies over LocalStorage JWTs** | Storing JWTs in `localStorage` makes them highly vulnerable to XSS attacks. `HttpOnly` cookies provide a native browser defense against script-based token theft. | Makes cross-domain API setups slightly more complex due to CORS and credential inclusion requirements. |
| **Strict API Rate Limiting by Route Type** | A blanket rate limit is ineffective. Auth endpoints need incredibly tight limits to stop brute force, while public read endpoints need higher limits to allow normal browsing but stop massive scrapers. | Requires a more sophisticated rate-limiting implementation (e.g., Redis-backed sliding windows) rather than a simple in-memory global counter. |
| **RBAC Enforcement at API Boundary** | UI-level hiding of buttons is a UX feature, not security. An attacker can always hit the API directly. The API must independently verify permissions. | Requires passing context (user role) deep into the request handling lifecycle and duplicating some logic between the frontend (for UX) and backend (for security). |
| **Append-Only, Isolated Audit Logs** | If an attacker gains admin access and deletes a movie, they will also try to delete the log showing they did it. Storing logs externally prevents this cover-up. | Requires setting up and paying for a separate logging infrastructure (e.g., Datadog, AWS CloudWatch) rather than just writing to a local file or the primary database. |
| **Soft Deletes for Critical Content** | Accidental or malicious deletion of the movie catalog is a catastrophic event. Soft deletes allow for instant recovery without needing to mount database backups. | Increases database size over time and requires all queries to include `WHERE deleted_at IS NULL` to avoid showing deleted content. |
| **Pre-Release Security Checks (CI/CD integration)** | Catching hardcoded secrets or vulnerable dependencies during the build process is infinitely cheaper and safer than finding them in production. | Adds time to the CI/CD pipeline and may introduce build failures due to false positives in vulnerability scanners. |
