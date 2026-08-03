# Authentication Security

## Identity Verification

Authentication is the first line of defense for the admin panel.

### Password Strength Requirements
- Enforce a minimum password length (e.g., 12 characters).
- Disallow commonly used passwords (check against a known breached password list if feasible, or use a zxcvbn-style entropy estimator).
- Do not enforce arbitrary complexity rules (like requiring exactly one special character) if the length and entropy are sufficient, as this encourages predictable password patterns.

### Secure Password Storage Expectations
- Passwords must NEVER be stored in plain text.
- Use a modern, memory-hard hashing algorithm such as Argon2id or bcrypt with a high work factor/cost.
- Passwords must be salted with a unique, cryptographically random salt per user.

### Login Throttling and Abuse Prevention
- Implement rate limiting specifically on the login endpoint (e.g., max 5 attempts per IP or username per 15 minutes).
- Consider exponential backoff for repeated failed attempts to thwart automated brute-force and credential stuffing attacks.

### Suspicious Login Detection
- Monitor for login attempts from highly unusual geographic locations or known malicious IP ranges, triggering alerts or requiring secondary verification if anomalous.

### Account Lockout Behavior
- After a defined number of consecutive failed login attempts (e.g., 10), temporarily lock the account (e.g., for 30 minutes) to stop targeted brute-force attacks.
- Provide a clear, secure path for admins to unlock their accounts via an email verification link.

### Recovery Verification Rules
- Password reset flows must use secure, single-use, time-limited tokens (e.g., expiring in 1 hour).
- Reset links must be sent only to the registered email address. Do not reveal if an email address exists in the system during the reset request to prevent user enumeration.

### Session Revocation Expectations
- Changing a password must immediately invalidate all active sessions for that user across all devices.

### Optional MFA Readiness
- The authentication architecture must be designed to accommodate Multi-Factor Authentication (MFA) in the future (e.g., TOTP or WebAuthn) without requiring a complete rewrite of the login flow.
