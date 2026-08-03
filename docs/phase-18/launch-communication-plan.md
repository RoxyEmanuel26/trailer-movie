# Launch Communication Plan

## Broadcasting the Release

A successful technical launch can still fail if the stakeholders and users aren't informed properly.

### Internal Notification Needs
- **Pre-Launch:** Notify the entire company (via Slack/Email) 24 hours before the launch window. Explain that the site may experience brief instability during the cutover.
- **Post-Launch:** The Release Captain posts a "Launch Successful" or "Launch Rolled Back" summary in the `#general` channel immediately after the deployment window closes.

### Support Contact Readiness
- If the project has a customer support team, they must be briefed on the new features, known issues, and provided with updated FAQ documentation *before* the launch.
- Establish a direct escalation channel between Customer Support and the On-Call Engineering team for the first 48 hours.

### Maintenance Notice
- If replacing an existing legacy site, configure a temporary "Under Maintenance" page to display on the legacy domain 15 minutes prior to the DNS cutover, preventing users from submitting forms to the old database while the migration is finishing.

### Public Announcement
- Coordinate with Marketing to ensure press releases, social media posts, and email newsletters do not go out until the Release Captain has officially declared the launch stable (usually 1-2 hours post-deployment).
