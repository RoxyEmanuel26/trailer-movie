# Account Lifecycle

An admin account transitions through several strict states throughout its existence.

## States
1. **`PENDING_INVITATION`:** The record is created, the email sent, but the user has not yet set a password. Login is impossible.
2. **`ACTIVE`:** The standard operating state. The user can log in and perform actions according to their role.
3. **`LOCKED`:** A temporary state triggered automatically by the system due to security anomalies (e.g., 5 failed login attempts). Requires a password reset or manual Super Admin intervention to unlock.
4. **`SUSPENDED`:** A manual state applied by a Super Admin. The user can no longer log in, and all their active sessions are immediately revoked. Used for offboarding employees.

## Transitions
- Accounts never transition to `DELETED`. They stay in `SUSPENDED` forever to preserve audit log integrity.
- Only a Super Admin can transition an account from `SUSPENDED` back to `ACTIVE`.
