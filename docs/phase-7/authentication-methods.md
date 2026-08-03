# Authentication Methods

## Supported Methods (MVP)

### 1. Email and Password Login
- **Target:** Admin Users.
- **Behavior:** Standard form-based login using a heavily hashed password (e.g., bcrypt or Argon2).
- **Why:** Simple, standard, and easy to implement without relying on third-party OAuth providers which can complicate local development.

### 2. Session-Based Authentication
- **Target:** Admin Users traversing the CMS UI.
- **Behavior:** Upon successful login, the server issues an HTTP-Only, Secure, SameSite=Lax cookie containing a session ID or a signed JWT.
- **Why:** HTTP-Only cookies are immune to Cross-Site Scripting (XSS) attacks, making them significantly more secure for web interfaces than storing tokens in `localStorage`.

### 3. Password Reset Flow
- **Target:** Admin Users.
- **Behavior:** Secure, time-limited (e.g., 15 minutes), single-use token sent via email to allow password resets.

## Unsupported Methods (For Now)

### Social Login (OAuth)
- **Status:** Skipped for MVP.
- **Why:** Implementing Google/GitHub login for a team of 5-10 admins is overkill. It will be re-evaluated when Public User Accounts are introduced, as social login vastly increases consumer sign-up rates.

### Multi-Factor Authentication (MFA)
- **Status:** Readiness planned, but skipped for immediate MVP.
- **Why:** The architecture will support TOTP (Time-based One-Time Passwords) in the future, particularly for Super Admins.
