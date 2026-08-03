# Environment Strategy

## Where Testing Happens

Testing in production is risky. We define a multi-tiered environment strategy to catch bugs before they reach the public.

### 1. Local Development (Dev)
- **Purpose:** Fast feedback for developers.
- **Data:** Uses a local SQLite or Dockerized PostgreSQL database with basic seed data.
- **Testing:** Developers run Unit and Integration tests locally before committing.

### 2. Preview / Pull Request Environments
- **Purpose:** Visual and functional review of a specific feature.
- **Setup:** When a PR is opened, a temporary URL (e.g., `pr-123.staging.trailer-site.com`) is spun up automatically.
- **Testing:** Product managers and designers can perform manual QA on the specific feature without waiting for a staging deployment.

### 3. Staging (Pre-Production)
- **Purpose:** The final dress rehearsal.
- **Setup:** Must be as identical to Production as possible (same database engine version, same CDN rules). Uses an anonymized snapshot of production data (if privacy policies allow) or a massive synthetic dataset.
- **Testing:** The full E2E test suite runs here. Performance audits (Lighthouse) are run here.

### 4. Production (Live)
- **Purpose:** Serving the public.
- **Testing:** "Smoke Testing" only. After a deployment, a very light, non-destructive automated script runs against production (e.g., load the homepage, verify HTTP 200, verify the hero image loads). We do *not* run destructive E2E tests (like creating and deleting movies) against the production database.

### Secret Safety
- Test environments must *never* use production API keys, production database credentials, or real payment gateway keys. They must use dedicated sandbox keys.
