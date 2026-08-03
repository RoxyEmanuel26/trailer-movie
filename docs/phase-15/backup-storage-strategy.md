# Backup Storage Strategy

## Securing the Safety Net

Backups are useless if they are destroyed in the same event that takes down the primary infrastructure.

### Primary vs. Secondary Locations
- **Primary Backups:** Managed automatically by the Database-as-a-Service (DBaaS) provider, typically stored in the same region as the database for fast restoration.
- **Secondary (Offsite) Backups:** To protect against a total provider failure (e.g., the DBaaS company goes bankrupt or AWS `us-east-1` goes completely offline), a weekly logical dump (e.g., `pg_dump`) must be exported to a completely different cloud provider (e.g., an Azure Blob Storage bucket).

### Access Restrictions and Immutability
- **The "Air Gap" Concept:** The credentials used by the production application to write data *must not* have permission to delete backups.
- **Immutability:** The secondary backup storage bucket must have "Object Lock" (WORM - Write Once, Read Many) enabled. This ensures that even if a hacker gains root access to the system and tries to delete the backups to extort a ransom, the cloud provider will physically block the deletion until the retention period expires.

### Encryption Expectations
- All backups must be encrypted at rest (e.g., AES-256).
- The encryption keys used for backups must be managed via a Key Management Service (KMS) and must be separate from the keys used for the live application database.

### Regional Redundancy
- Secondary backups and media replications should always be stored in a different geographic region (e.g., primary in Virginia, backup in Oregon) to protect against natural disasters affecting a single datacenter cluster.
