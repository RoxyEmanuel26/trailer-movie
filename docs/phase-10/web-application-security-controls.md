# Web Application Security Controls

## Browser Security

Configure the application to leverage the browser's built-in security mechanisms to protect users and admins.

### CSRF Protections
- If using cookie-based sessions, implement Cross-Site Request Forgery (CSRF) protection.
- Use Anti-CSRF tokens for all state-changing requests (POST, PUT, DELETE, PATCH).
- Ensure the `SameSite` attribute on session cookies is set to `Lax` or `Strict` as a primary defense.

### XSS Prevention Expectations
- **Context-Aware Escaping:** Modern frontend frameworks (React, Vue, Svelte) handle output escaping by default. Ensure developers do not bypass this (e.g., avoid `dangerouslySetInnerHTML` unless strictly necessary and combined with rigorous server-side sanitization).
- **Sanitization:** As defined in Input Validation, sanitize all user-provided HTML before rendering it.

### Clickjacking Mitigation
- Prevent the admin panel (and potentially the public site, if desired) from being embedded in an iframe on malicious sites.
- Use the `X-Frame-Options: DENY` or `SAMEORIGIN` header.
- Alternatively, use the `frame-ancestors` directive in the Content Security Policy (CSP).

### Safe Redirect Handling
- Avoid open redirects. If the application takes a URL parameter for redirection (e.g., `?next=/admin/dashboard`), strictly validate that the target URL is a relative path or belongs to an allowed whitelist of domains. Never blindly redirect to user-provided input.

### CORS Expectations
- Configure Cross-Origin Resource Sharing (CORS) strictly.
- The backend API should only accept cross-origin requests from explicitly trusted domains (e.g., the production frontend domain, staging domains). Do not use `Access-Control-Allow-Origin: *` for authenticated endpoints.

### Content Security Policy (CSP) Awareness
- Implement a robust Content Security Policy (CSP) via HTTP headers.
- Restrict where scripts, styles, images, and frames can be loaded from. This drastically mitigates the impact of XSS attacks by preventing the execution of inline scripts and unauthorized external scripts.

### HTTPS Enforcement
- Enforce HTTPS for all traffic using HTTP Strict Transport Security (HSTS) headers (`Strict-Transport-Security: max-age=31536000; includeSubDomains`).
- Ensure all cookies are marked with the `Secure` attribute.
