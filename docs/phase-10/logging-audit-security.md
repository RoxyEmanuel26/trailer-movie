# Logging and Audit Security

## Secure Observability

Logs are essential for detecting and investigating security incidents, but they can also become a vulnerability if they leak sensitive data or are tampered with.

### What Must Never Be Logged
- Plain-text passwords.
- Full session tokens or JWTs (log the session ID or user ID instead).
- Full credit card numbers or highly sensitive PII.
- API keys or secrets (including those passed in headers like `Authorization: Bearer <secret>`).

### How Sensitive Fields Should Be Redacted
- Implement log masking/redaction at the application boundary. If a request body contains a "password" field, the logger must automatically replace its value with `[REDACTED]` before writing to the log stream.

### Audit Log Tamper Resistance
- Critical audit logs (e.g., "User X deleted Movie Y") should be stored in a centralized logging system (like Datadog, AWS CloudWatch, or an ELK stack) that is separate from the application database.
- The application should only have "append" permissions to this logging system, ensuring an attacker who compromises the application cannot delete past logs to cover their tracks.

### Log Retention Considerations
- Retain security and audit logs for a sufficient period to allow for post-incident investigation (e.g., 90 to 365 days, depending on compliance requirements).
- Automatically archive older logs to cheaper, cold storage.

### Access to Logs Restrictions
- Access to the centralized logging system must be strictly limited to authorized DevOps and Security personnel. Developers should not have default access to production logs containing potentially sensitive user data.

### Security Event Visibility
- Ensure the logging system is configured to generate alerts for high-severity security events, such as:
  - Repeated failed login attempts for admin accounts.
  - Unexpected changes to user roles.
  - Application crashes caused by malformed input (potential injection attempts).
  - Rate limit breaches.
