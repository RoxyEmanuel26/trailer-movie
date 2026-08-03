# Admin Analytics

## Tracking Internal Operations

Admin analytics provide visibility into the operational health of the platform and the productivity of the team.

### Why Admin Analytics Matter
- **Security:** Detecting compromised accounts or insider threats.
- **Productivity:** Understanding if admins are spending excessive time on manual tasks that should be automated (e.g., manually fixing 100 broken posters a day).
- **Auditability:** Knowing exactly who changed a critical piece of data when something goes wrong.

### Key Admin Actions to Track
- **Login Activity:** Track successful and failed `admin_login` events, including timestamps and rough IP geolocation.
- **Content Mutations:** Track `movie_create`, `movie_update`, and `movie_delete` events.
- **Bulk Operations:** Track when tools that modify many records at once are used.
- **Settings/Configuration Changes:** Track modifications to site-wide settings (e.g., changing the featured hero movie).
- **Sync Triggers:** Track manual invocations of external API syncs (e.g., "Pull latest from TMDB").

### Failed Admin Actions
- Track when an admin attempts an action but fails (e.g., a 403 Forbidden due to insufficient RBAC permissions, or a 500 error due to a malformed payload). High failure rates indicate confusing UI or broken internal APIs.
