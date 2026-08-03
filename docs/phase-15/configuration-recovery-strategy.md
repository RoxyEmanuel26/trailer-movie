# Configuration Recovery Strategy

## Restoring the Nervous System

If the hosting provider account is deleted, the database might be safe in an offsite backup, but the application cannot connect to it without its configuration and secrets.

### Infrastructure as Code (IaC)
- The primary configuration recovery strategy is treating configuration as code.
- If the Vercel/AWS environment is lost, an engineer should be able to run `terraform apply` (or similar) to recreate the project, domains, and routing rules instantly from Git.

### Secret Rotation After Compromise
- **Scenario:** The Secret Manager was compromised (e.g., a developer's laptop was stolen with full access credentials).
- **Rule:** You cannot simply restore old secrets from a backup. Every single secret (Database Passwords, TMDB API Keys, Stripe Keys, JWT Signing Secrets) must be **rotated** (regenerated) at the source provider and updated in the new Secret Manager.
- Never restore a compromised key.

### Third-Party Provider Settings
- Many SaaS tools (e.g., Auth0, SendGrid) have complex internal settings.
- **Recovery:** Where possible, manage these via their respective Terraform providers so their configuration is also backed up in Git. If done manually, the operational runbook must contain a checklist of required settings (e.g., "Ensure Callback URLs are updated in Auth0").
