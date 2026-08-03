# Recovery and Incident Response

When things go wrong, there must be a predefined path back to a secure state.

## 1. Lost Admin Access
- **Standard Admin:** Uses the "Forgot Password" flow via email.
- **Single Super Admin Locked Out:** If the only Super Admin forgets their password AND loses access to their email, the system must support a CLI command (e.g., `php artisan make:admin` or `npm run reset-admin`) that can only be executed by an engineer with direct SSH access to the production server.

## 2. Session Breach Response (The Panic Button)
- If a Super Admin suspects an account has been breached (e.g., seeing unusual audit logs), they must be able to click a single "Revoke All User Sessions" button on the suspect's profile.
- This immediately deletes the user's session ID from the database or flips a `session_valid_after` timestamp, rendering all current cookies invalid instantly.

## 3. Global Breach
- In the event of a suspected widespread breach (e.g., a database dump leaked), changing the global `JWT_SECRET` or `SESSION_SECRET` in the `.env` file and restarting the server will instantly invalidate every single logged-in session worldwide, forcing a clean slate.
