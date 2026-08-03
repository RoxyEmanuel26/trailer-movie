# Troubleshooting Documentation

## When Things Break

Troubleshooting guides exist to speed up the transition from "Something is wrong" to "Here is how to fix it." They must be highly structured.

### Structure of a Troubleshooting Guide
Every entry in the `/docs/runbooks/troubleshooting.md` file follows this structure:

1. **Symptom:** What does the user or monitor see? (e.g., "The homepage returns a 504 Gateway Timeout").
2. **Probable Causes:** Ranked by likelihood. (1. The database connection pool is exhausted. 2. A recent deployment shipped a bad SSR query. 3. The CDN is experiencing a regional outage).
3. **Diagnostic Steps:** How to prove which cause is correct. (e.g., "Check the Database connections metric in the cloud dashboard. If it is flatlining at 100%, it is cause #1").
4. **Resolution Steps:** How to fix it. (e.g., "If it is the connection pool, instantly revert the last deployment using Vercel rollback. Then restart the database instance to clear dead connections.")
5. **Escalation Path:** Who to call if the resolution doesn't work.

### Rollback vs. Repair
- The troubleshooting guide must explicitly state the policy: **If the issue started within 15 minutes of a deployment, the first step is always Rollback.** Do not attempt to write a "hotfix" repair PR while production is bleeding.
