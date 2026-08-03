# Session Security

## Protecting Authenticated State

Sessions represent authenticated users and must be heavily guarded against theft and manipulation.

### Session Implementation
- Use secure, server-side sessions or robustly signed and encrypted JWTs (JSON Web Tokens).
- If using cookies (recommended for web applications), they must be marked with `HttpOnly`, `Secure` (HTTPS only), and `SameSite=Lax` (or `Strict` for critical admin areas) flags.

### Session Lifetime Expectations
- Sessions must not last indefinitely.
- **Absolute Timeout:** Require re-authentication after a set period regardless of activity (e.g., 7 days for admin panels).

### Inactivity Timeout Expectations
- **Idle Timeout:** Automatically terminate the session if the user has been inactive for a specific duration (e.g., 4 hours).

### Logout Invalidation
- The logout function must explicitly destroy the session on the server side (or add the JWT to a revocation blocklist if using stateless tokens) AND instruct the client browser to delete the session cookie.

### Session Revocation on Credential Changes
- As stated in Auth Security, any change to a user's password, role, or security settings must immediately invalidate all currently active sessions for that user.

### Device/Session Visibility Ideas
- Future-proof the architecture to allow users to view their active sessions (e.g., "Chrome on Windows (IP: 192.168.1.1)") and manually revoke unfamiliar ones.

### Concurrent Session Policy
- Decide on a policy for concurrent logins. For high-security admin panels, limiting an account to a single active session (logging out the old session when a new one starts) can reduce the risk of shared credentials.

### Session Hijack Mitigation
- Tie sessions to a specific IP address or User-Agent where appropriate. If a session token is suddenly presented from a vastly different IP or device, flag it as suspicious and require re-authentication.
- Enforce TLS/HTTPS across the entire application to prevent Man-in-the-Middle (MitM) session sniffing.
