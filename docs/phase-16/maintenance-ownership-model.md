# Maintenance Ownership Model

## Who Holds the Keys?

After the initial build agency or lead engineer hands off the project, responsibilities must be explicitly assigned to prevent "Tragedy of the Commons" neglect.

### Code & Infrastructure Ownership
- **Owner:** Lead Engineer / Tech Lead.
- **Responsibilities:** Approving PRs, rotating production secrets, scheduling major framework upgrades, and ensuring the CI/CD pipeline remains green.

### Content & SEO Ownership
- **Owner:** Managing Editor / SEO Lead.
- **Responsibilities:** Approving daily movie curations, maintaining taxonomy consistency, writing custom metadata, and responding to Google Search Console alerts (e.g., 404 spikes).

### Security & Compliance Ownership
- **Owner:** Security Engineer / CTO.
- **Responsibilities:** Triaging automated dependency vulnerability alerts (e.g., Snyk), auditing admin access quarterly, and ensuring compliance with data privacy laws (GDPR/CCPA).

### Incident Response (On-Call) Ownership
- **Owner:** Rotating schedule of DevOps/Backend Engineers.
- **Responsibilities:** Acknowledging PagerDuty alerts within 5 minutes, executing Disaster Recovery runbooks, and leading post-mortem reviews.

### Documentation Ownership
- **Owner:** The Entire Team (governed by the Tech Lead).
- **Responsibilities:** Updating docs is a shared responsibility. The Tech Lead enforces the rule that no PR is merged if it renders existing documentation inaccurate.
