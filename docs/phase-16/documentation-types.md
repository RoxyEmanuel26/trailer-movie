# Documentation Types

## Categorizing Knowledge

To prevent a massive, unsearchable "Wiki-dump," documentation is strictly categorized by its purpose.

### 1. Product & Architecture Overview
- **Role:** The 10,000-foot view. Explains what the product is, the core tech stack, and the major subsystems (Frontend, Admin, DB). Used for day-one onboarding.

### 2. System Design Documents (The "Phases")
- **Role:** Deep dives into specific architectural areas (e.g., SEO Strategy, Security Architecture). Explains the constraints, choices, and rules governing that specific domain.

### 3. API & Database References
- **Role:** The technical contracts. Defines exactly what a `Movie` object looks like in the database and what the `GET /api/movies` endpoint returns.

### 4. User Guides (Admin / Content Workflow)
- **Role:** Instructional manuals for non-technical users on how to operate the CMS to manage the movie catalog.

### 5. Operational Guides (Deployment / Recovery / Security)
- **Role:** Instructions for keeping the site running, secure, and recoverable.

### 6. Runbooks & Troubleshooting Notes
- **Role:** "Break-glass" procedures. Step-by-step instructions for what an engineer must do at 3:00 AM when the site goes down or a deployment fails.

### 7. Decision Logs & Change Logs
- **Role:** The historical ledger. Decision logs explain *why* we pivoted; Change logs explain *what* exactly changed in v1.4.2.
