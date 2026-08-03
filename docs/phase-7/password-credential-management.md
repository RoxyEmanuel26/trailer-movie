# Password and Credential Management

## 1. Password Reset Flow
1. User clicks "Forgot Password" and enters their email.
2. The system generates a cryptographically secure, random 64-character token, hashes it, and stores it in a `password_resets` table with an expiration of 15 minutes.
3. The plaintext token is emailed as a link.
4. When the user clicks the link, the server hashes the provided token and compares it to the database. If it matches, the user can set a new password.
5. Setting a new password immediately invalidates all active sessions for that user.

## 2. Admin Credential Changes
- An admin can change their password while logged in, but they must provide their *current* password to authorize the change.

## 3. Secret Handling Rules for Admins
- System configuration secrets (e.g., Database URL, JWT Secret) must never be visible in the CMS UI.
- Service API keys (TMDB, YouTube) *can* be managed in the Settings UI by Super Admins, but they must be masked (`****`) by default and require a click to reveal or edit.
