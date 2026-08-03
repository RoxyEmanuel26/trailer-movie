# Technical Debt Management

## Overview
Technical debt is inevitable, especially when prioritizing speed to market or fast hotfixes. If left unmanaged, it slows down future development and increases the risk of systemic failures.

## Identifying Debt
*   **Code Smells:** Functions that are too long, duplicated code, or complex nested logic.
*   **Outdated Dependencies:** Libraries that are no longer maintained or are significantly behind the current stable version.
*   **Architectural Debt:** Using a monolithic database for everything when a specialized caching layer is now needed.
*   **Missing Tests:** Areas of the codebase with low or zero test coverage.

## Ranking Debt by Impact
1.  **High Impact:** Debt that causes frequent bugs, severe performance issues, or security vulnerabilities (e.g., an outdated, vulnerable authentication library).
2.  **Medium Impact:** Debt that significantly slows down developer velocity (e.g., lack of automated deployment for a specific service, causing manual errors).
3.  **Low Impact:** Messy code that works perfectly and is rarely touched (e.g., an ugly script used once a year).

## Scheduling Debt Repayment
*   **The 20% Rule:** Allocate approximately 20% of every sprint's capacity to addressing technical debt.
*   **Dedicated Sprints:** If debt becomes overwhelming, schedule a dedicated "Tech Debt / Refactor" sprint where no new features are built.
*   **Opportunistic Refactoring:** The "Boy Scout Rule" – leave the code better than you found it. When working on a feature, refactor the immediately surrounding code if it is messy.

## Avoiding Debt Accumulation During Fast Fixes
*   **The "Hack" Rule:** Sometimes a dirty hack is required to fix a SEV-1 incident quickly.
*   **The Follow-up:** If a hack is merged, a ticket to refactor the hack properly must be created immediately and placed at the top of the next sprint's backlog.

## Documenting Accepted Debt
*   Not all debt needs to be paid off. If rewriting an old module would take 3 months and provides no tangible user benefit, the debt can be accepted.
*   **Action:** Add comments in the code explaining *why* the debt is accepted and document it in the Technical Debt Backlog as "Won't Fix - Accepted."
