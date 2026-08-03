# Handoff Package Design

## Transferring Ownership

A handoff occurs when an agency transfers the project to a client, or a departing lead engineer hands the project to a successor. The handoff package must be comprehensive enough that the receiver can deploy an update on day one.

### The Handoff Checklist

1. **Project Summary & Architecture Overview:**
   - Link to the core architecture documents.
   - List of all third-party services utilized (Hosting, DB, Email, Analytics).

2. **Environment & Setup Requirements:**
   - Explicit Node.js version requirements (e.g., `.nvmrc`).
   - Instructions for spinning up the local development environment.

3. **Credentials & Secret Handling:**
   - We do *not* send secrets in a zip file.
   - The handoff must include the transfer of ownership (or admin invites) to the production Secret Manager, Hosting Provider, Database Dashboard, and Domain Registrar.

4. **Deployment Instructions:**
   - How to trigger a deployment to Staging.
   - How to promote Staging to Production.
   - How to perform an emergency rollback.

5. **Known Limitations & Open Questions:**
   - A brutally honest list of technical debt (e.g., "The search query is slow if the catalog exceeds 50,000 movies and will need refactoring").
   - Features that were descoped during the build phase.

6. **Support Contacts:**
   - Support PINs or account numbers for the cloud providers in case the new owner needs to open a support ticket immediately.
