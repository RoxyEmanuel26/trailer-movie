# Audit and Traceability

Security is useless if you cannot trace a breach after the fact.

## 1. Auth-Specific Logging
The `audit_logs` table (designed in Phase 5) must specifically track the following Auth events:
- **`AUTH_LOGIN_SUCCESS`:** Logs the `user_id`, timestamp, and IP address.
- **`AUTH_LOGIN_FAILED`:** Logs the attempted email and IP address. High velocity indicates a brute force attack.
- **`AUTH_PASSWORD_RESET_REQUESTED`:** Logs the email and IP.
- **`AUTH_PASSWORD_CHANGED`:** Logs the `user_id`.
- **`AUTH_PRIVILEGE_ESCALATION`:** Logs when a Super Admin promotes a Content Editor to a Super Admin (highly sensitive).

## 2. Suspicious Access Attempts
- If an authenticated user continuously attempts to hit endpoints they lack permissions for (yielding `403 Forbidden` errors), the system should log a `SUSPICIOUS_ACTIVITY` event and alert a Super Admin. This often indicates a compromised account exploring the boundaries of its access.
