const FULL_ACCESS_ROLES = new Set(['admin', 'super admin', 'super_admin']);

export interface RoleWithPermissions {
  name: string;
  permissions: Array<{ permission: { action: string } }>;
}

/**
 * Checks whether a role satisfies a required permission action.
 * - Built-in full-access admin roles have unrestricted dashboard access.
 * - Canonical `write:<domain>` grants `create|update|delete:<domain>` (one-way).
 * - Narrow permissions (`create|update|delete:<domain>`) never elevate to `write:<domain>`.
 */
export function hasRolePermission(
  role: RoleWithPermissions | null | undefined,
  action?: string,
): boolean {
  if (!action) return true;
  if (!role) return false;
  if (FULL_ACCESS_ROLES.has(role.name.trim().toLowerCase())) {
    return true;
  }

  const granted = new Set(role.permissions.map((rp) => rp.permission.action));
  if (granted.has(action)) return true;

  const [verb, domain] = action.split(':');
  if (!domain) return false;
  if (verb === 'create' || verb === 'update' || verb === 'delete') {
    return granted.has(`write:${domain}`);
  }
  return false;
}
