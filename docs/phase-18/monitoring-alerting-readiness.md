# Monitoring and Alerting Readiness

## Eyes on the System

A silent launch is a terrifying launch. We must know instantly if something is broken.

### Error Monitoring (Sentry/Bugsnag)
- **Check:** Purposely trigger a handled exception in the production RC environment. Does it appear in the Sentry dashboard? Are source maps correctly uploaded so the stack trace shows actual code lines, not minified gibberish?

### Analytics Collection (Google Analytics / Plausible)
- **Check:** Ensure the tracking script is present on production. Open the Real-Time analytics dashboard and verify that navigating the site generates pageview events.

### Uptime Monitoring
- **Check:** Configure an external uptime monitor (e.g., BetterStack, Pingdom) to ping the production homepage every 1 minute.
- **Blocker:** The uptime monitor must be integrated with PagerDuty or Slack, alerting the on-call engineer instantly if the site returns a 500 error or takes longer than 10 seconds to respond.

### Backup Verification Alerts
- **Check:** Ensure that if the daily automated database snapshot fails, an alert is actively routed to the DevOps team's Slack channel. We cannot discover a backup failure 6 months later during a disaster.
