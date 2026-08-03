# Cost and Resource Management

## Financial Architecture

Infrastructure must scale efficiently, but unchecked auto-scaling can lead to catastrophic billing surprises.

### Resource Sizing Concepts
- Start small. Do not provision a massive 32-core database instance for a site with 100 daily visitors.
- Utilize serverless databases (which scale to zero when idle) or small burstable instances for early stages, upgrading only when metrics prove the current tier is a bottleneck.

### Scaling Cost Triggers (Billing Alarms)
- Set up strict billing alerts in the cloud provider dashboard.
- Create an alert that triggers a Slack notification if the estimated monthly bill exceeds 120% of the normal baseline.
- **Action:** If an attack or unexpected traffic spike drives compute costs exponentially higher, the team must be notified to intervene (e.g., by aggressively caching the expensive endpoint at the edge).

### Bandwidth Cost Awareness (The "Egress" Problem)
- Serving video directly from an Object Storage bucket incurs massive egress fees.
- **Mitigation:** Always use a CDN with a favorable bandwidth pricing model (e.g., Cloudflare) in front of the storage bucket. Ensure the CDN cache hit rate for media files is > 95%.

### Log Retention Cost Awareness
- Storing terabytes of application logs indefinitely is expensive.
- **Strategy:** Retain highly detailed `INFO` and `DEBUG` logs for only 7-14 days. Retain `ERROR` and access logs for 30-90 days for compliance/security. Archive older logs to cheap cold storage (e.g., S3 Glacier) if required by law.

### Overprovisioning Avoidance
- Do not leave unused Preview environments running indefinitely. Configure the CI/CD pipeline to automatically destroy temporary databases and environments when a Pull Request is closed or merged.
