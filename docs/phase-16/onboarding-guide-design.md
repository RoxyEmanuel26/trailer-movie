# Onboarding Guide Design

## Day One for a New Contributor

The goal of the onboarding guide is to get a new engineer to run the application locally and submit their first Pull Request (a simple UI tweak or typo fix) within their first 4 hours on the job.

### Order of Study

1. **The Entry Point:** Read the root `README.md`.
2. **Environment Setup:** Follow the steps to clone the repo, run `npm install`, copy the `.env.example` to `.env`, and run the local development server.
3. **Architecture Skim:** Read the Product Overview and the Tech Stack summary. Do not read the deep-dive Phase documents yet.
4. **The First Task:** Pick a "Good First Issue" from the issue tracker.
5. **Workflow Rules:** Read the `CONTRIBUTING.md` file, which defines the branch naming conventions (e.g., `feat/`, `fix/`), commit message standards, and Pull Request review requirements.

### Where to Find Answers (The Mental Map)
The onboarding guide must provide a cheat sheet for finding deeper knowledge:
- *Why is this built this way?* -> Look in `/docs/logs/decision-log.md`.
- *How do I deploy this?* -> Look in `/docs/runbooks/deployment.md`.
- *The staging environment is broken!* -> Look in `/docs/runbooks/troubleshooting.md`.
- *How do I add a new database column?* -> Look in `/docs/architecture/database.md`.
