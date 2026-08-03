# Test Restore Strategy

## The Fire Drill

A disaster recovery plan that has never been tested is just a theory. Routine drills are mandatory.

### Routine Restore Drills (Bi-Annual)
- Every 6 months, the engineering team must execute a full "Game Day" exercise.
- **The Drill:** Spin up a completely new, isolated Staging environment using *only* the documentation in the DR Runbook and the automated backups.
- **Validation:** Ensure the application boots, data is intact, and media loads.
- **Outcome:** Update the DR Runbook to fix any steps that were confusing, outdated, or missing.

### Partial Restore Drills (Quarterly)
- Test the PITR (Point-in-Time Recovery) functionality.
- **The Drill:** Select a specific minute from yesterday. Spin up a temporary database instance from that exact minute. Write a SQL query to extract a specific movie record and verify it matches the state of the data at that time.

### Configuration Drills
- Test the Infrastructure as Code (IaC) templates.
- **The Drill:** Deploy the Terraform/Pulumi templates to a sandbox cloud account to verify that they still successfully provision the required VPCs, buckets, and serverless project shells without manual clicking in the UI.

### The Rule of Un-tested Backups
If a backup has not been successfully restored in a drill within the last 6 months, it must be operationally treated as if it does not exist.
