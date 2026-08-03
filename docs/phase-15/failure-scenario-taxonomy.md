# Failure Scenario Taxonomy

## What We Must Prepare For

The system must be resilient against the following failure modes, ranked roughly by likelihood and impact.

### 1. Human Error During Admin Operations
- **Scenario:** An editor accidentally runs a bulk-delete on the "Action" genre, wiping out 500 movie associations.
- **Why it matters:** This is the most common cause of data loss. It requires granular, point-in-time recovery to undo the specific mistake without rolling back all other legitimate edits made since then.

### 2. Broken Release / Failed Deployment
- **Scenario:** A new code release includes a bad database migration that locks the `movies` table or causes 500 errors on the homepage.
- **Why it matters:** Stops all user traffic immediately. Requires instant application rollback (Phase 14) and careful database state coordination.

### 3. Configuration or Secret Loss
- **Scenario:** The production Stripe API key is accidentally deleted from the Secret Manager, breaking all billing.
- **Why it matters:** Often harder to diagnose than code failures. Requires robust versioning and backup of infrastructure configuration.

### 4. Database Corruption or Loss
- **Scenario:** The managed database provider suffers a catastrophic failure, or a malicious actor drops all tables.
- **Why it matters:** Total system failure. Requires full restoration from the latest offsite backup snapshot.

### 5. Media Asset Loss
- **Scenario:** An S3 bucket configuration mistake accidentally deletes all uploaded movie posters.
- **Why it matters:** The site remains functional, but the UI is completely broken (missing images). Requires restoration from a secondary replica bucket.

### 6. Provider Outage (CDN or Hosting)
- **Scenario:** The primary hosting provider (e.g., Vercel) or CDN (e.g., Cloudflare) goes down completely.
- **Why it matters:** Out of our control, but requires a pre-planned communication strategy and an understanding of DNS TTLs if we need to failover to a different provider.
