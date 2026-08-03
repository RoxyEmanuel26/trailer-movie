# Environment Strategy

## The Staging Pipeline

We utilize four distinct environments to safely move code from a developer's laptop to the public.

### 1. Local Development
- **Purpose:** Fast, iterative coding and initial testing.
- **Data:** Local SQLite or Dockerized PostgreSQL container. Seeded with dummy data.
- **Secrets:** Stored in local `.env` files. Uses sandbox API keys (e.g., Stripe Test keys).
- **Access:** Developer's local machine only.

### 2. Preview (Feature Branch) Environments
- **Purpose:** UI and functional review of a specific Pull Request before merging to `main`.
- **Data:** Connects to a shared "Preview" database (or uses an isolated branch database if using a modern DBaaS like Neon or PlanetScale).
- **Secrets:** Managed by the CI/CD platform. Sandbox keys only.
- **Access:** Publicly accessible via obscure URL, but often protected by a simple HTTP Basic Auth or VPN to prevent indexing by Google.

### 3. Staging (Pre-Production)
- **Purpose:** Final verification, E2E testing, and client sign-off. The code here mirrors the `main` branch exactly.
- **Data:** Connects to a dedicated Staging database. Ideally contains an anonymized, sanitized snapshot of production data.
- **Secrets:** Staging-specific keys. Must be strictly separated from Production keys.
- **Access:** Internal team only. Must serve `X-Robots-Tag: noindex`.

### 4. Production (Live)
- **Purpose:** Serving the public.
- **Data:** The live Production database.
- **Secrets:** Real production keys. Highly restricted access via a secret manager (e.g., AWS Secrets Manager, Vercel Env Vars).
- **Access:** Public traffic via CDN. Developer access to the underlying infrastructure is heavily restricted and logged.
