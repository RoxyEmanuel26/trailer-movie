# Incident Triage Workflow

## Overview
When issues occur in production, a structured triage process ensures they are handled efficiently, appropriately prioritized, and fully resolved.

## Severity Levels

*   **SEV-1 (Critical):** Complete system outage, core functionality broken for all users (e.g., site down, database offline, video playback completely broken).
    *   *Response:* Immediate, drop-everything. 
*   **SEV-2 (High):** Major functionality degraded or broken for a significant subset of users, or a severe security vulnerability discovered.
    *   *Response:* Work begins immediately or within the hour.
*   **SEV-3 (Medium):** Non-critical bug, cosmetic issue, or minor feature broken. System is usable.
    *   *Response:* Logged to the backlog and prioritized in the next sprint.
*   **SEV-4 (Low):** Minor typos, very rare edge cases, slight UI misalignments.
    *   *Response:* Logged to the backlog for "when time permits."

## First Response Actions
1.  **Acknowledge:** The on-call engineer or designated responder acknowledges the alert (e.g., via Slack, PagerDuty).
2.  **Assess Severity:** Determine the SEV level based on the criteria above.
3.  **Contain:** Apply immediate mitigations if possible (e.g., rollback to the previous deployment, scale up database resources, block an attacking IP).
4.  **Communicate:** Notify stakeholders (internal team, and users via status page if SEV-1/SEV-2).

## Ownership Assignment
*   For SEV-1/SEV-2, the first responder becomes the **Incident Commander** until explicitly handed off.
*   The Incident Commander coordinates the engineering response and handles communication.
*   For SEV-3/SEV-4, ownership is assigned during regular backlog triage meetings.

## Escalation Triggers
*   Escalate to Lead Engineer/CTO if a SEV-1 issue cannot be identified or mitigated within 30 minutes.
*   Escalate to DevOps/Infrastructure partners if the issue lies outside application code (e.g., AWS/Vercel platform outage).
*   Escalate to Security Lead if the incident involves a potential data breach.

## Resolution Tracking
*   All incidents must be tracked in the issue tracking system (Jira, Linear, GitHub Issues).
*   Status updates must be appended to the ticket at regular intervals (e.g., every 30 mins for SEV-1).
*   An incident is "Resolved" only when the fix is deployed to production and verified.

## Post-Incident Review (PIR) Expectations
*   A PIR (or Post-Mortem) is mandatory for all SEV-1 and SEV-2 incidents.
*   Must be completed within 3 business days of resolution.
*   **Focus:** Blameless analysis of *what* happened, *why* it happened (5 Whys), and *how* to prevent it in the future.
*   **Output:** Action items added to the technical debt or feature backlog to improve system resilience.
