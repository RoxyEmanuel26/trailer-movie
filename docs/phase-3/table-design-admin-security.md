# Table Design: Admin & Security

These tables handle authentication, authorization, and accountability for the CMS.

## 1. `admin_users` Table
- **id** (UUID/BIGINT) - Primary Key
- **email** (VARCHAR) - Required, Unique.
- **password_hash** (VARCHAR) - Required.
- **name** (VARCHAR) - Required.
- **role_id** (UUID/BIGINT) - Foreign Key to `roles`. Required.
- **is_active** (BOOLEAN) - Required. Defaults to `true`. Allows disabling an employee's access without deleting their historical audit logs.
- **last_login_at** (TIMESTAMP) - Optional.

## 2. `roles` and `permissions` Tables (RBAC)
- **`roles` Table:**
  - **id** (UUID/BIGINT) - Primary Key
  - **name** (VARCHAR) - Required, Unique. (e.g., "SuperAdmin", "Editor").
- **`permissions` Table:**
  - **id** (UUID/BIGINT) - Primary Key
  - **action** (VARCHAR) - Required, Unique. (e.g., `movies.create`, `settings.update`).
- **Pivot Table: `role_permissions`**
  - `role_id`, `permission_id`

## 3. `audit_logs` Table
A tamper-evident trail of actions performed in the CMS.
- **id** (UUID/BIGINT) - Primary Key
- **admin_user_id** (UUID/BIGINT) - Foreign Key to `admin_users`. Optional (if automated sync).
- **action_type** (ENUM) - Required. `create`, `update`, `delete`.
- **entity_type** (VARCHAR) - Required. Polymorphic type (e.g., `Movie`, `Setting`).
- **entity_id** (UUID/BIGINT) - Required. Polymorphic ID.
- **old_values** (JSON) - Optional. State of the row before the change.
- **new_values** (JSON) - Optional. State of the row after the change.
- **ip_address** (VARCHAR) - Optional.
- **created_at** (TIMESTAMP) - Required.
- *Note: This table has no `updated_at` or `deleted_at`. Logs are append-only.*
