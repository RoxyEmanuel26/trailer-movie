# Security and Permission Enforcement

The admin panel is the gateway to the database; it must be locked down tight.

## 1. Authentication Security
- **MFA / 2FA:** Super Admins must be required to use Two-Factor Authentication (e.g., Google Authenticator / TOTP). 
- **Session Management:** Admin sessions must expire automatically after 24 hours of inactivity.
- **Brute Force Protection:** 5 failed login attempts will lock the IP address and the account for 15 minutes.

## 2. Authorization (RBAC in the UI)
- **Frontend Guardrails:** If a user (e.g., Content Editor) does not have permission to access the "Settings" page, the link must not render in the sidebar. 
- **Backend Enforcement:** Hiding the button is not enough. The API route (`GET /api/admin/settings`) must explicitly check the user's role and return a `403 Forbidden` if accessed directly.

## 3. Sensitive Action Confirmation
- Destructive actions (Deleting a movie, dropping a table, banning a user) must require the admin to re-enter their password or type the entity name to confirm intent.

## 4. API Key Rotation
- The Settings panel should allow Super Admins to rotate external API keys (TMDB, YouTube) instantly without requiring a full redeploy of the application.
