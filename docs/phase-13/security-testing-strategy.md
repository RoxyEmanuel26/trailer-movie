# Security Testing Strategy

## Verifying Defenses

Security testing verifies that the boundaries defined in the Security Architecture (Phase 10) are actually enforced by the code.

### Automated Security Checks

1. **Login & Session Protection:**
   - E2E Test: Attempt to log in with an invalid password. Verify failure. Attempt to log in without a CSRF token. Verify failure.
   - Integration Test: Ensure session cookies are set with `HttpOnly`, `Secure`, and `SameSite` flags.

2. **Permission Boundary Checks (RBAC):**
   - Integration Test: Create three mock users (Viewer, Editor, Admin). Try to access the `DELETE /api/movies/1` endpoint with each token. Assert Viewer gets 401/403, Editor gets 403, and Admin gets 200.

3. **Input Validation (XSS/SQLi):**
   - API Test: Submit a movie title containing `<script>alert('xss')</script>`. Verify that the API either rejects the payload or properly sanitizes/escapes it upon retrieval.

4. **Secret Exposure Checks:**
   - CI Pipeline: Run a tool like `trufflehog` or `git-secrets` to scan every PR to ensure developers have not accidentally hardcoded API keys or database credentials into the repository.

### Public Endpoint Abuse Checks
- **Rate Limiting:** Send 100 requests to the `/api/search` endpoint in 1 second. Verify the server responds with HTTP 429 Too Many Requests, proving the rate limiter works and the DB is protected from basic DoS attempts.

### Routine Vulnerability Scanning
- The CI pipeline should automatically run `npm audit` or use tools like Snyk or Dependabot to block deployments if a known CVE (Common Vulnerabilities and Exposures) is found in the project's dependencies.
