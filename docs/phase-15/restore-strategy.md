# Restore Strategy

## Bringing the System Back

A backup is only half the battle; the ability to restore it reliably is what actually matters.

### Priority Order of Recovery
In a total loss scenario, restoration must occur in this exact order:
1. **Infrastructure & Networking:** Restore DNS routing, VPCs, and CDN configurations.
2. **Secrets:** Restore API keys and database credentials to the Secret Manager.
3. **Database:** Restore the primary relational database from the latest snapshot.
4. **Application:** Deploy the latest known-good release of the web application.
5. **Media:** Ensure the media bucket is attached and functioning (restore from replica if needed).
6. **Search & Analytics:** Trigger background jobs to rebuild search indexes.

### Full Restore Expectations
- A full restore involves spinning up a completely new database instance from a snapshot and updating the application's `DATABASE_URL` to point to the new instance. We do *not* attempt to overwrite the broken live database directly.

### Partial / Point-in-Time Restore (The "Oops" Scenario)
- If an admin deletes 10 specific movies by accident, we do *not* perform a full database restore (which would erase all legitimate work done by other admins since the backup).
- **Strategy:** Spin up a temporary database instance from the PITR snapshot taken 5 minutes before the mistake. Manually extract (dump) the 10 missing records, and insert them back into the live production database. Destroy the temporary instance.

### Configuration Restore
- If IaC (Terraform/Pulumi) is used, restoring infrastructure configuration is simply a matter of running `terraform apply` against the cloud provider using the configuration stored in Git.
