# Operational Ownership Model

## Who is Responsible?

Clear ownership prevents the "I thought you were monitoring that" problem during an outage.

### Deployment Ownership
- **Developers:** Own the code, the tests, and the responsibility to merge PRs.
- **CI/CD Pipeline:** Owns the physical act of building and deploying the artifact. Developers do not deploy from their laptops.

### Incident Ownership
- **On-Call Engineer:** The person currently scheduled on PagerDuty. They own acknowledging the alert and leading the triage effort.
- **Escalation:** If the on-call engineer cannot resolve the issue within 30 minutes, they escalate to a Senior Engineer or DevOps Lead.

### Backup and DR Ownership
- **DevOps / Platform Lead:** Owns the configuration of automated backups.
- **QA/Engineering Team:** Owns the bi-annual disaster recovery drill to prove the backups actually work.

### Access Ownership
- **CTO / Lead Architect:** Owns the provisioning and revocation of access to Production infrastructure, API keys, and the Secret Manager.
- **Rule:** When an employee leaves, their access to the Secret Manager and CI/CD provider must be revoked within 1 hour.

### Monitoring and Configuration
- **The Whole Team:** Infrastructure as Code (IaC) and configuration changes are proposed via Pull Requests. Therefore, the whole team owns the configuration through code review, just like product features.
- No single person should make unreviewed changes via a cloud provider's web UI.
