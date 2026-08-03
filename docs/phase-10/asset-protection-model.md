# Asset Protection Model

## Critical Assets and Sensitivity

We categorize our assets by sensitivity to determine the appropriate level of protection.

### Tier 1: Critical (Catastrophic Impact if Compromised)
- **Admin Accounts & Passwords:** High target. Protected via strong hashing (Argon2/bcrypt), rate limiting, and future MFA readiness.
- **Session Tokens:** Allow impersonation of admins. Protected via secure, HTTP-only cookies and strict expiration policies.
- **API Keys and Secrets:** Access to external services, databases, and cryptographic signing. Protected by strict environment variable management, never committed to source control, and restricted at the infrastructure level.
- **Database Credentials:** Direct access to all data. Handled identically to API keys, ideally with network-level restrictions (VPC).

### Tier 2: High (Severe Impact if Compromised)
- **Content Integrity (Movies, Trailers):** The core product. Protected by strict Role-Based Access Control (RBAC) in the admin panel and input validation.
- **SEO Metadata Integrity:** Tampering harms search rankings and traffic. Protected alongside content integrity.
- **Audit Logs:** Crucial for incident response. Must be append-only or heavily protected against tampering to ensure non-repudiation.
- **Deployment Credentials:** Allows malicious code deployment. Protected by CI/CD secrets management and restricted access to the deployment pipeline.
- **Backup Data:** Contains historical snapshots of all Tier 1 and Tier 2 data. Protected by encryption at rest and isolated storage access.

### Tier 3: Moderate (Moderate Impact if Compromised)
- **Analytics Data:** Insight into user behavior. Protected by access controls on the analytics platform, ensuring PII is minimized.
- **Media Assets (Images):** Publicly visible, but unauthorized alteration constitutes defacement. Protected by CMS upload restrictions and CDN configuration.

### Protection Expectations
- **Tier 1** assets require defense-in-depth: encryption, strict network isolation, and rigorous access auditing.
- **Tier 2** assets require strong authorization checks and regular integrity validation.
- **Tier 3** assets require standard web application security controls to prevent tampering and abuse.
