# Data Protection and Integrity

## Safeguarding Information

Data must be protected from accidental deletion, malicious tampering, and logical corruption.

### Validation Expectations
- The database schema must enforce data integrity at the lowest level (e.g., foreign key constraints, `NOT NULL` requirements, unique constraints for slugs or emails).
- Do not rely solely on application-level validation to maintain database consistency.

### Dangerous Write Restrictions
- Limit direct database access (e.g., via SQL clients or raw connections) strictly to authorized infrastructure personnel. The application should be the sole gateway for data modification in normal operations.

### Soft Delete vs Hard Delete Policy
- **Soft Deletes:** Prefer soft deletes (setting a `deleted_at` timestamp) for critical entities like Movies, Categories, or User accounts. This allows for recovery from accidental deletions or malicious mass-deletion events.
- **Hard Deletes:** Reserve hard deletes (permanent removal) for compliance requests (e.g., GDPR) or automated pruning of ephemeral data (like expired sessions).

### Audit Trail Integrity
- For critical operations (creating/editing/deleting movies, changing settings), maintain an audit log recording *who* made the change, *what* was changed, and *when*.
- Ensure this audit log is append-only or stored in a separate, highly restricted table/database to prevent an attacker from covering their tracks.

### Backup Protection
- Backups are a prime target for ransomware or data theft.
- Ensure automated, encrypted backups are taken regularly (e.g., daily).
- Store backups in a location physically and logically isolated from the primary database (e.g., a different AWS account or a dedicated secure bucket).

### Content Change Verification Rules
- For highly sensitive content (like the homepage featured trailer), consider implementing a dual-authorization workflow or alerting mechanism where significant changes notify a secondary admin.
