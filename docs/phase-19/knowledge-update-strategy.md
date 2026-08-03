# Knowledge Update Strategy

## Overview
Post-launch, the system evolves and incidents reveal gaps in understanding. Documentation must be treated as a living entity. Outdated documentation is actively harmful during an outage.

## Trigger: Post-Incident Reviews (PIRs)
*   **Runbook Updates:** If an incident required steps not documented in the runbooks, the runbook must be updated as a mandatory action item of the PIR.
*   **Troubleshooting Guide Updates:** Add newly discovered failure modes and their symptoms to the troubleshooting guides to speed up future diagnosis.

## Trigger: Major Architecture Changes
*   **Architecture Updates:** When a new system component is introduced (e.g., adding Redis for caching), the core architecture diagrams and data flow documentation must be updated in the same Pull Request as the code.
*   **Decision Log Updates:** Any significant technical decision (e.g., choosing to switch email providers) must be recorded in the Decision Log, detailing *why* the choice was made.

## Trigger: QA and Security Audits
*   **QA Checklist Updates:** If a bug slips through to production, the manual QA checklist or the automated test suite must be updated to catch that specific edge case in the future.
*   **Security Notes Updates:** After a security audit or patching a vulnerability, update the security guidelines to prevent similar vulnerabilities from being introduced in new code.

## Trigger: Team Changes
*   **Handoff Documentation Updates:** Before any key team member leaves or transitions off the project, they must review and update the onboarding and system overview documentation to ensure tribal knowledge is not lost.

## Enforcement
*   **Documentation as Code:** Treat documentation updates with the same rigor as code updates. A PR introducing a complex new feature should not be approved if the accompanying documentation is missing.
*   **Quarterly Review:** Schedule a brief quarterly task to review critical runbooks and ensure they are still accurate against the current production environment.
