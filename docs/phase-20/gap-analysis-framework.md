# Gap Analysis Framework

## Overview
During the final audit, we expect to find discrepancies between the intended scope and the actual implementation. The Gap Analysis Framework provides a structured way to identify and categorize these missing pieces.

## Identification Vectors

1.  **Requirement Traceability Matrix (RTM):** Cross-reference the initial PRD/Feature List against the live application.
    *   *Result:* Identifies "Missing Features" (e.g., "User accounts were descoped but not documented").
2.  **Manual QA Walkthroughs:** End-to-end execution of all documented user flows.
    *   *Result:* Identifies "Broken Workflows" or "Untested Critical Paths."
3.  **Code & Architecture Review:** Compare Phase 2 diagrams with the actual deployed infrastructure.
    *   *Result:* Identifies "Unapproved Architectural Drift" (e.g., using a different database technology than planned).
4.  **Automated Scans:** Run security scanners, Lighthouse CI, and SEO crawlers.
    *   *Result:* Identifies "Unresolved Security/Performance/SEO Issues."
5.  **Documentation Audit:** Check for the existence and accuracy of required runbooks and API specs.
    *   *Result:* Identifies "Incomplete Documentation."

## Categorizing Gaps

Once identified, every gap must be assigned to one of the following buckets:

*   **Blocker (Must Fix Now):** Prevents master sign-off. Includes broken core features, severe security risks, or missing critical documentation.
*   **Technical Debt (Fix Later):** Architectural drift or performance issues that do not break the core experience but degrade maintainability. Requires a Jira/Linear ticket in the backlog.
*   **Descoped (Won't Fix):** A feature intentionally dropped to meet a deadline. Requires a formal note in the Decision Log acknowledging the descoping.

## Resolution
The final audit cannot pass while "Un-categorized" gaps exist. Every gap found must be explicitly categorized as a Blocker (and fixed), Technical Debt (and ticketed), or Descoped (and documented).
