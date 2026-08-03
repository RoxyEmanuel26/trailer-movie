# Immediate Fix Policy

## Triage After Launch

When a bug is discovered on launch day, the team must decide whether to fix it immediately, roll back, or wait.

### 1. Critical Fixes (Fix Immediately)
- **Examples:** The login form is broken; checkout/signup fails; a severe XSS vulnerability is found.
- **Action:** Stop all other work. A developer branches off `main`, writes the fix, bypasses standard QA pipelines (with Tech Lead approval), and deploys the "Hotfix" directly to production.

### 2. High-Risk Fixes (Roll Back)
- **Examples:** The database is locking up due to a bad query; the new UI is causing a memory leak that crashes the user's browser.
- **Action:** Do not attempt to write a complex hotfix under pressure. Execute the Emergency Launch Reversal (Rollback) to restore stability, then fix the code in the staging environment without rushing.

### 3. Medium-Risk Fixes (Wait for Next Sprint)
- **Examples:** A specific movie poster is not aligning correctly on iPad Safari; the search bar returns results slightly slower than expected.
- **Action:** Log the issue in the bug tracker. Do not deploy a hotfix. Address it in the normal development cycle.

### 4. Safe Non-Breaking Fixes (Fix Next Day)
- **Examples:** A typo on the homepage; a missing meta tag.
- **Action:** Submit a standard PR. Merge and deploy through the normal CI/CD pipeline the following morning.
