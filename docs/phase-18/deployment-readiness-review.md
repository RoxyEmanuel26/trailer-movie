# Deployment Readiness Review

## Validating the Release Mechanics

The mechanics of the launch must be as frictionless and predictable as possible.

### Production Environment Readiness
- **Check:** Ensure the production database is on a production-tier instance type, not a shared/hobby tier that will crash under the launch traffic spike.
- **Check:** Verify that Edge caching (CDN) is fully active and not bypassed by a misconfigured caching header.

### Secret Readiness
- **Check:** All third-party integrations (Stripe, SendGrid, TMDB) must be switched from their "Test/Sandbox" API keys to their "Live/Production" API keys.

### Database Migration Readiness
- **Check:** Ensure `prisma generate` and `prisma migrate deploy` are correctly hooked into the CI/CD pipeline so that the production schema is automatically updated before the new code boots.

### Release Owner Assignment
- **Requirement:** One specific person must be designated as the "Release Captain." They are responsible for pushing the final button, watching the dashboards, and making the split-second call to roll back if things go wrong.

### Deployment Window Considerations
- **Rule:** Never launch at 5:00 PM on a Friday. 
- **Recommendation:** Launch between 9:00 AM and 11:00 AM on a Tuesday or Wednesday. This ensures the entire engineering team is online and well-rested to handle post-launch anomalies for the next 48 hours.
