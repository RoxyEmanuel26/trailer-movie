# Sensitive Action Protection

Certain actions in the CMS are destructive or have massive system-wide implications. These require extra friction.

## 1. Protected Actions
- Hard Deleting a Movie (bypassing the trash).
- Changing an Admin's Role or Permissions.
- Purging the global CDN Cache.
- Rotating API Keys in Settings.

## 2. Friction Mechanisms
- **Re-Authentication (Sudo Mode):** When an admin attempts a protected action, even if they are logged in, a modal appears requiring them to re-enter their password (similar to GitHub's sudo mode). This protects against "left the laptop open at a coffee shop" scenarios.
- **Explicit Confirmation:** For bulk destructive actions, the admin must type a confirmation phrase (e.g., `DELETE 50 MOVIES`) into a text input before the submit button enables.

## 3. Alerts
- Executing a sensitive action immediately fires an alert (via Slack/Discord integration or email) to all Super Admins: "User [Name] just purged the Global Cache."
