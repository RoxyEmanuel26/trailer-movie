# Change Governance After Launch

## Overview
Before launch, development moves quickly with minimal oversight. After launch, changes affect real users and search rankings. Change governance ensures that updates are reviewed appropriately based on their risk level.

## Normal Change Approval Process
*   **Applies to:** Standard bug fixes, minor UI enhancements, routine dependency updates.
*   **Process:**
    1.  Developer creates a Pull Request (PR).
    2.  CI/CD runs automated tests and linters.
    3.  One other engineer approves the PR via code review.
    4.  Merge and deploy.

## High-Risk Change Approval Process
*   **Applies to:** Major database migrations, core architecture changes, complete UI redesigns, changes to authentication.
*   **Process:**
    1.  Requires a written proposal/RFC (Request for Comment) before coding begins.
    2.  Must be reviewed and approved by the Lead Engineer/CTO.
    3.  Requires dedicated manual QA on a staging environment.
    4.  Must include a documented rollback plan.
    5.  Deployed during off-peak hours.

## Emergency Fix Process (Hotfixes)
*   **Applies to:** SEV-1 and SEV-2 incidents actively breaking production.
*   **Process:**
    1.  Bypass standard PR review if immediate action is required to restore service.
    2.  Fix is pushed directly to `main` (or equivalent hotfix branch).
    3.  *Mandatory Follow-up:* The code must be reviewed post-deployment, and a Post-Incident Review (PIR) must be conducted.

## Content-Only Change Process
*   **Applies to:** Updating movie metadata, replacing trailer links, publishing new featured lists.
*   **Process:**
    1.  No engineering approval required.
    2.  Managed entirely by the editorial/admin team via the CMS.
    3.  CMS should have built-in validation (e.g., preventing publishing a movie without a title) to prevent breaking the frontend.

## SEO-Only Change Process
*   **Applies to:** Updating meta titles/descriptions, adding canonical tags, editing `robots.txt`.
*   **Process:**
    1.  Can often be done via the CMS (like content changes).
    2.  If requiring code changes, follows the Normal Change Approval Process, but must be reviewed by the SEO lead (or someone with SEO knowledge) to ensure no unintended negative impacts.

## Security-Only Change Process
*   **Applies to:** Patching critical CVEs, updating WAF rules, rotating compromised keys.
*   **Process:**
    1.  Treated similarly to the Emergency Fix Process.
    2.  Requires immediate action and verification, prioritizing speed of remediation over standard sprint planning.
