# Session and Token Strategy

Strict session management prevents unauthorized access from abandoned devices or compromised tokens.

## 1. Session Lifetime
- **Admin Sessions:** Maximum lifetime of 24 hours.
- **Inactivity Timeout:** Sessions should ideally expire after 4 hours of inactivity.
- **Refresh Behavior:** If using JWTs in cookies, the server should silently issue a new token (rolling session) if the user is active within the last hour of their token's lifespan.

## 2. Token Storage
- Tokens (or Session IDs) must be stored in **HTTP-Only, Secure cookies**.
- They must NEVER be accessible via `document.cookie` in JavaScript.

## 3. Logout and Revocation
- **Logout:** Explicitly clears the cookie and marks the session ID as invalid in the database (or Redis cache).
- **Remote Revocation:** Super Admins can click "Revoke All Sessions" on a user's profile, immediately clearing their active sessions in the database/cache.
- **Automatic Invalidation:** Changing a password or an email address automatically invalidates all existing sessions for that user, forcing them to log in again on all devices.
