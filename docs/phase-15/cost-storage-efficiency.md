# Cost and Storage Efficiency

## Affordable Resilience

Continuity must be maintained without bankrupting the project with astronomical storage fees.

### Tiered Storage (The Lifecycle Policy)
- Keeping 10 years of daily backups in "Hot" storage (e.g., standard S3) is financially irresponsible.
- **Strategy:** Implement automated lifecycle rules on the backup storage bucket.
  - **Day 1-30:** Hot Storage (Standard - instant access).
  - **Day 31-365:** Cool Storage (Infrequent Access - lower storage cost, higher retrieval cost).
  - **Year 1+:** Cold Storage (Glacier - lowest storage cost, takes hours to retrieve).

### Deduplication and Incremental Backups
- Avoid taking full 100GB snapshots every single hour.
- **Strategy:** Rely on Incremental backups (only saving what changed since the last backup) or WAL streaming, which drastically reduces the amount of data transferred and stored.

### Media Redundancy Trade-offs
- Replicating massive 4K video trailers across three different global regions will cause storage costs to explode.
- **Strategy:** Assess criticality. Replicate the *metadata* and *posters* heavily, as they are small and critical for the UI. If raw trailer videos are hosted internally, consider replicating them to only *one* cheaper, slower secondary region, accepting a slightly longer RTO for video playback during a disaster.

### Cost Escalation Triggers
- Set up specific billing alarms tied *only* to the backup storage buckets. If a misconfigured script starts backing up the entire database every 5 minutes instead of daily, the alarm will catch the massive spike in storage costs before the end-of-month bill arrives.
