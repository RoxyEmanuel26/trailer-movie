# Security Launch Readiness

## Locking the Doors

Before exposing the application to the public internet, all development backdoors must be closed.

### Secrets Protection
- **Blocker:** Confirm that no `.env.local` files containing production secrets were accidentally committed to the Git repository.
- **Check:** Verify that the production Database URL, JWT Secrets, and external API keys have been securely added to the hosting provider's Secret Manager.

### Admin Access Protection
- **Check:** Ensure the default "admin@admin.com / password" account used during local development does not exist in the production database.
- **Check:** Verify that attempting to access `/admin/dashboard` while logged out immediately redirects to a secure login prompt.

### Rate Limiting and Input Validation
- **Check:** Verify that a bot attempting to brute-force the login endpoint receives a `429 Too Many Requests` response after 5-10 failed attempts.
- **Check:** Verify that public search inputs are sanitized to prevent basic Cross-Site Scripting (XSS) or SQL Injection attacks.

### Audit Logging
- **Check:** If a user logs into the Admin panel and deletes a movie, does a secure log record *who* did it and *when*? (Crucial for post-launch incident investigations).
