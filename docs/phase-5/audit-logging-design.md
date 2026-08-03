# Audit Logging Design

Audit logs are non-negotiable for a multi-user CMS. They answer the question: "Who broke the homepage?"

## 1. What Gets Logged
Every mutating action (`POST`, `PUT`, `DELETE`) in the admin API must generate a log entry in the `audit_logs` table.
- **Content Creation:** Creating a movie, genre, or user.
- **Content Updates:** Changing a synopsis, swapping a trailer, toggling a lock field.
- **Deletions:** Soft and hard deletes.
- **System Actions:** Triggering manual syncs, clearing caches, updating global settings.
- **Auth Events:** Successful logins, failed login attempts, password resets.

## 2. Log Payload Structure
Each log entry must capture:
- `user_id`: Who did it.
- `action`: E.g., `update`, `delete`, `sync`.
- `entity_type`: E.g., `movies`, `settings`.
- `entity_id`: The specific record affected.
- `payload`: A JSON diff showing `old_values` and `new_values`.

## 3. UI Presentation
- The Dashboard should show a simplified "Recent Activity" feed (e.g., "Jane updated 'The Batman'").
- The dedicated "Audit Logs" page allows Super Admins to filter by User, Date, or Entity Type.

## 4. Retention Policy
- Logs are kept indefinitely for core content changes.
- High-volume automated logs (e.g., cron job successes) may be purged after 90 days to save database space.
