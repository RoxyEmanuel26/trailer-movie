# Open Issues Handling

## Overview
It is rare for a project to close with zero open issues. How these unresolved issues are managed dictates the health of the project on day two.

## Categorizing Unresolved Issues

### 1. Blocking Issues
*   **Definition:** Issues that violate the Final Quality Gate or Risk Acceptance Model.
*   **Handling:** The project phase *cannot be closed*. The launch must be delayed until these are resolved.

### 2. Non-Blocking Issues (Bugs)
*   **Definition:** Minor UI glitches, edge-case errors, or non-critical performance issues.
*   **Handling:** Logged in the active Bug Backlog. Must be assigned a severity (SEV-3 or SEV-4) and prioritized for upcoming maintenance sprints.

### 3. Deferred Issues (Features/Tech Debt)
*   **Definition:** Planned work that was intentionally descoped to meet the launch deadline.
*   **Handling:** Logged in the Feature or Technical Debt Backlog. Must include the rationale for deferral.

### 4. Accepted Issues (Risks)
*   **Definition:** Known issues where the cost to fix outweighs the benefit.
*   **Handling:** Formally recorded in the Decision Log as "Accepted Risk" with stakeholder sign-off. Closed in the issue tracker.

## Ownership and Follow-up
*   Every unresolved issue transferred to the backlog *must* have an owner (e.g., Lead Engineer for Tech Debt, Product Owner for Features).
*   Deferred issues should have a timebox or follow-up expectation (e.g., "Review caching strategy in Q3").
*   "Orphan" tickets with no owner or clear next step should be closed to prevent backlog bloat.
