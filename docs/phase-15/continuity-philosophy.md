# Continuity Philosophy

## Guiding Principles for Backup and Recovery

Operational continuity for the trailer platform means ensuring that users can always discover and watch trailers, and that editors never permanently lose their curated data. 

### What Must Be Recoverable
- The relational database (Movies, Genres, Cast, Editorial Metadata).
- Uploaded media assets (Original posters, specific trailer files if self-hosted).
- The infrastructure configuration required to spin up the application.

### What Can Be Rebuilt
- **Search Indexes:** We do not backup the Typesense/Elasticsearch index. If the system fails, we restore the primary database and trigger a script to rebuild the search index from scratch.
- **Compiled Assets & Caches:** We do not backup the CDN cache or the Next.js `.next` build folder. These are ephemeral and automatically regenerated upon a fresh deployment.

### The Balance of Speed, Safety, and Cost
- **Speed:** Restoring the application to a functional state must be fast enough to prevent major SEO ranking drops (ideally under 4 hours).
- **Safety:** Backups must be immutable and isolated from the primary production environment to protect against malicious actors.
- **Cost:** We will not run an active-active, fully redundant hot-standby database purely for DR in the early stages, as the cost is prohibitive. We rely on fast restoration from cold storage instead.
