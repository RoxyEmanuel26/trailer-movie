# Admin Invitation and Onboarding

The CMS does not have a public registration page. Admin accounts are exclusively created via invitation.

## 1. Invitation Flow
1. A Super Admin navigates to User Management and clicks "Invite User".
2. They input the new user's email address and assign an initial Role.
3. The system generates an Invitation Token (valid for 48 hours) and emails a secure link to the invitee.
4. The invitee clicks the link, which routes to a specialized onboarding page (`/admin/setup?token=xyz`).
5. The invitee creates their password and confirms it.
6. The account state transitions from `PENDING` to `ACTIVE`.

## 2. Security Benefit
This prevents an attacker from creating an account and attempting to escalate privileges from within. The attacker cannot even begin the login flow without an active account provisioned by a Super Admin.

## 3. Deactivation Rules
When an employee leaves, their account should be marked as `SUSPENDED` or `DISABLED`, never deleted.
**Why:** The `admin_users` table is heavily linked to the `audit_logs` and `movies` table (e.g., `created_by`). Deleting the user row would cause massive cascade deletion issues or orphans in the database.
