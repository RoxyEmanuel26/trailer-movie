# Deployment Pipeline Design

## The Path to Production

The deployment pipeline is fully automated. Code pushes trigger predictable, audited workflows.

### 1. Code Commit & CI (Continuous Integration)
- Developer pushes a branch to GitHub/GitLab.
- **Build Verification:** The CI server attempts to build the project. If the build fails (e.g., TypeScript error), the pipeline stops.
- **Automated Tests:** Unit and Integration tests run. Linting and formatting checks run. If any fail, the pipeline stops.

### 2. Preview Deployment
- If CI passes, the PaaS provider automatically deploys the branch to a temporary URL (e.g., `feature-xyz.preview.app.com`).
- A link to the Preview is posted back to the Pull Request for manual review.

### 3. Staging Deployment (Continuous Delivery)
- The Pull Request is approved and merged into the `main` branch.
- The CI/CD pipeline deploys `main` to the Staging environment.
- The End-to-End (E2E) test suite runs against the Staging URL.

### 4. Production Deployment (Approval Gates)
- **Automatic vs. Manual:** Depending on team preference, deploying from Staging to Production can be automatic (if E2E passes) or require a manual "Promote to Production" button click.
- **Behavior:** The deployment must be zero-downtime. The new version is spun up, health checks are verified, and traffic is routed to the new version seamlessly.

### Rollback Concept
- The pipeline must support "Instant Rollback."
- Because deployments are immutable artifacts, rolling back means simply instructing the load balancer/CDN to route traffic back to the previous successful artifact, taking seconds, not minutes.
