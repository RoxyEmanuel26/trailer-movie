# Authorization Security

## Access Control Hardening

Once a user is authenticated, the system must strictly verify what they are allowed to do.

### Role-Based Restrictions (RBAC)
- Implement a clear Role-Based Access Control system.
- Examples:
  - **Viewer/Read-Only:** Can view admin dashboards but cannot modify data.
  - **Editor:** Can create and edit movie entries, but cannot publish them or delete them.
  - **Admin:** Can publish, edit, and delete movie entries.
  - **Super Admin:** Can manage user accounts, alter system settings, and perform catastrophic actions.

### Permission Checks at Multiple Levels
- **UI Level:** Hide buttons and navigation links for actions the user cannot perform. (This is for UX, not security).
- **API Boundary:** Every secured API endpoint MUST independently verify the user's role and permissions before processing the request. UI checks are easily bypassed.
- **Data Access Layer:** Where complex logic exists, ensure the database query itself scopes the action to the user's permissions.

### Privilege Escalation Prevention
- Ensure that endpoints responsible for updating user profiles or roles explicitly reject attempts by lower-privileged users to assign themselves higher roles (e.g., an Editor cannot send a JSON payload setting `"role": "Super Admin"`).

### Safe Defaults for New Roles
- Any newly created user account or role must default to the lowest possible privilege (least privilege principle). Access must be explicitly granted, not implicitly assumed.

### Admin-Only Dangerous Actions
- Actions like bulk deletion, clearing caches, or altering SEO taxonomy must be restricted to Admin or Super Admin roles.

### Super-Admin-Only Recovery Paths
- Managing the admins themselves (creating new admins, resetting their passwords forcefully) should be reserved for a Super Admin role to prevent rogue admins from locking out others.
