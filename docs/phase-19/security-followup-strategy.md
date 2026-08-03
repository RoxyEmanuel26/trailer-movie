# Security Follow-Up Strategy

## Overview
Security is a continuous process, not a state achieved at launch. Post-launch operations must actively monitor for threats, rotate credentials, and patch vulnerabilities to protect user data and system integrity.

## Permission Reviews
*   **Cadence:** Quarterly.
*   **Action:** Review all IAM (Identity and Access Management) roles on AWS/Vercel/Database providers. Ensure the Principle of Least Privilege is maintained. Revoke access for former team members immediately.

## Admin Account Reviews
*   **Cadence:** Monthly.
*   **Action:** Audit accounts with access to the custom CMS or admin panel. Remove inactive accounts. Ensure all admin accounts require Two-Factor Authentication (2FA).

## Secret Rotation Reviews
*   **Cadence:** Bi-annually (or immediately upon suspected compromise).
*   **Action:** Rotate API keys (e.g., TMDB, Sendgrid), database passwords, and JWT signing secrets. Update CI/CD environment variables and restart services to ensure the new secrets are picked up without downtime.

## Dependency Security Checks
*   **Cadence:** Weekly (Automated).
*   **Action:** Rely on tools like Dependabot or `npm audit` to flag known vulnerabilities in third-party packages. Schedule updates based on the severity of the CVE (Critical = Immediate hotfix, Low = Next sprint).

## Login Anomaly Review
*   **Cadence:** Ongoing (Automated Alerts).
*   **Action:** If using an auth provider (e.g., Supabase, Auth0), configure alerts for credential stuffing attacks or sudden spikes in failed login attempts. Investigate anomalies and apply rate limits or IP bans as necessary.

## Abuse Pattern Review
*   **Cadence:** Monthly.
*   **Action:** Analyze web traffic and WAF logs for scraping behavior, excessive API requests, or attempts to bypass rate limits. Adjust WAF rules to block malicious user-agents or IP ranges.

## Audit Log Review
*   **Cadence:** Monthly.
*   **Action:** Review admin activity logs to ensure no unauthorized changes were made to the site's content, settings, or user data.

## Incident Follow-Up Actions
*   **Trigger:** Post-Security Incident.
*   **Action:** If a security breach or near-miss occurs, the Post-Incident Review (PIR) must generate specific action items (e.g., patching a specific endpoint, enhancing logging) which are prioritized at the top of the next sprint.
