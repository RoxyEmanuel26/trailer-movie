# Privacy and Data Minimization

## Protecting User Data

The best way to secure sensitive data is to not collect it in the first place.

### Minimal Personal Data Collection
- Since this is currently a movie trailer site with an admin panel, personal data is mostly limited to admin accounts.
- Do not collect extraneous personal information (phone numbers, physical addresses) from admins unless strictly necessary for MFA or billing.
- If public user accounts are added later, adhere to the principle of least privilege regarding data collection: only ask for what is absolutely required to provide the service.

### Retention Minimization
- Do not keep data forever "just in case."
- Implement automated pruning for ephemeral data:
  - Expired session tokens should be deleted from the database.
  - Password reset tokens should be deleted after expiration or use.
  - Detailed web server access logs should be aggregated and the raw logs deleted after a set period (e.g., 30 days).

### Analytics Privacy Principles
- When tracking user behavior (e.g., which trailers are popular), use privacy-focused analytics tools where possible.
- Anonymize IP addresses before storing them in analytics platforms.
- Do not send Personally Identifiable Information (PII) to third-party analytics providers.

### Log Data Minimization
- As outlined in the Logging Security document, actively redact sensitive information from logs. Logs should tell you *what* happened, not expose the sensitive data involved in the transaction.

### User Privacy Implications (Future-Proofing)
- If features like "Watchlists" or "User Reviews" are added, the architecture must support the ability for users to easily delete their accounts and all associated data, complying with regulations like GDPR or CCPA.
