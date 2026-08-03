# Secrets and Configuration Strategy

## Protecting the Keys to the Kingdom

Configuration and secrets must be strictly separated from the codebase (The Twelve-Factor App methodology).

### Environment Variable Categories
1. **Public Configuration:** Non-sensitive settings required by the frontend (e.g., `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GA_TRACKING_ID`). These are embedded into the client bundle at build time.
2. **Private Configuration:** Non-sensitive backend settings (e.g., `MAX_PAGINATION_LIMIT=100`).
3. **Secrets:** Highly sensitive credentials (e.g., `DATABASE_URL`, `STRIPE_SECRET_KEY`, `JWT_SIGNING_SECRET`). These must never be exposed to the browser.

### Secret Storage Expectations
- **Never** commit `.env.local` or `.env.production` files to Git.
- Secrets must be stored in a secure Secret Manager (e.g., AWS Secrets Manager, Doppler, GitHub Secrets, or the hosting provider's secure Environment Variables UI).

### Local Development Secret Handling
- Developers use a `.env` or `.env.local` file (which is in `.gitignore`).
- Onboarding documentation should provide a `.env.example` file showing the required keys with dummy values.
- Shared development keys can be synced securely using tools like Doppler or 1Password Developer Tools.

### Staging vs. Production Differences
- Staging must use entirely separate API keys and database credentials.
- If a staging API key is compromised, it should have zero access to production data or production billing accounts.

### Rotation Expectations
- The infrastructure must allow for rapid secret rotation. If a key is compromised, an admin must be able to update the secret in the manager and trigger an instant rolling restart of the application to apply the new key with zero downtime.
