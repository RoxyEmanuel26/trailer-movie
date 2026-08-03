# Login Security Requirements

Protecting the Admin login portal is the first line of defense.

## 1. Brute-Force Prevention
- **Rate Limiting:** Maximum 5 failed login attempts per 15 minutes per IP address.
- **Lockout:** After 5 failures, the IP is temporarily banned from hitting the `/login` endpoint.
- **Account Lockout:** Alternatively, if a specific email address sees 10 failed attempts (even across different IPs), lock the account and send an email alert to the user.

## 2. Password Policy
- Passwords must be a minimum of 12 characters.
- Hashing must use a slow, memory-hard algorithm like `bcrypt` (with a high work factor, e.g., 12 rounds) or `Argon2`. 
- Plaintext passwords must NEVER be logged or stored, even in temporary memory dumps.

## 3. Session Anomalies
- If a user logs in from an IP address in New York, and 5 minutes later their session cookie is used from an IP in Russia, the session should be immediately flagged as suspicious and revoked, forcing a re-login.
