# Disaster Recovery Runbook Design

## The Operator's Guide

During a disaster, panic causes mistakes. The DR Runbook provides a strict, step-by-step checklist for the responding engineer.

### 1. Detection & Assessment
- **Trigger:** PagerDuty alert indicating total database connection failure or 500 error spike.
- **Action:** The on-call engineer checks the DBaaS dashboard. Is the instance down? Was it deleted? Is it a regional cloud outage?
- **Decision:** Declare a "Severity 1 Incident."

### 2. Communication
- **Internal:** Post in the `#incident-response` Slack channel: "@here Investigating total DB failure. Initiating DR Runbook."
- **External:** Update the public status page (e.g., status.trailer-site.com) to "Investigating: Site experiencing major issues."

### 3. Containment
- **Action:** If the failure is caused by a runaway application loop or a malicious attack, instantly scale the web application workers to 0, or enable the CDN "Under Attack" mode to stop the bleeding and protect the infrastructure.

### 4. Restoration (The Core Loop)
- **Step 4a:** Provision a new database instance from the latest automated snapshot.
- **Step 4b:** Verify the new instance is healthy and data is present (Smoke test via SQL client).
- **Step 4c:** Update the Secret Manager (e.g., Vercel Env Vars) with the new `DATABASE_URL`.

### 5. Verification & Reopening
- **Action:** Redeploy the web application to force it to pick up the new secret.
- **Check:** Run the automated Release Validation script (Phase 14).
- **Reopen:** If contained earlier, scale the web workers back up. Update the status page to "Resolved."

### 6. Post-Incident Review (Blameless)
- **Action:** Within 48 hours, schedule a meeting to discuss: What broke? Why did the monitor not catch it sooner? How do we automate the fix so this specific failure never happens again?
