# Public User Auth Readiness

While the MVP focuses on public anonymity and admin curation, the architecture is primed for public user accounts in the future.

## 1. Separation of Concerns
- The `admin_users` table is entirely separate from the future `users` table. 
- They will use different authentication guards and middleware. This ensures a vulnerability in the public login flow cannot accidentally grant CMS access.

## 2. Future Features Supported
- **Watchlists/Favorites:** Authenticated users will hit endpoints like `POST /api/v1/user/favorites`. The auth middleware will extract the `user_id` from the JWT/Session and append it to the database insert.
- **Ratings & Comments:** Requires an authenticated identity to prevent spam and allow moderation.
- **Personalized Recommendations:** Auth state allows the server to query viewing history to tailor the homepage.

## 3. Registration Flow Readiness
- The system will eventually need to support OAuth (Google/Apple) for high conversion rates. The internal Auth Service should be designed as an interface so `LocalStrategy` (email/password) and `OAuthStrategy` can be swapped or combined easily later.
