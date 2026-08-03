# Security Testing and Verification

## Ensuring Continuous Safety

Security controls are only effective if they are verified to be working correctly.

### Pre-Release Checks
- Integrate static application security testing (SAST) tools (like SonarQube or ESLint security plugins) into the CI pipeline to catch common vulnerabilities (like hardcoded secrets or unsafe regex) before code is merged.

### Permission Testing
- Write automated integration tests specifically designed to verify authorization logic.
- E.g., Test that a user with the "Viewer" role receives a 403 Forbidden when attempting to POST to the `/api/movies` endpoint.

### Dependency Vulnerability Checks
- Run `npm audit` or use tools like Dependabot/Snyk continuously on the codebase to identify known CVEs in third-party packages. Set the CI pipeline to fail if high-severity vulnerabilities are found.

### Secret Exposure Checks
- Use tools like `trufflehog` or `git-secrets` in pre-commit hooks or the CI pipeline to scan code for accidental inclusion of high-entropy strings or known API key formats before they are committed to the repository.

### Manual Abuse Checks
- Before major releases, developers should manually attempt basic abuse scenarios:
  - Trying to bypass UI restrictions by hitting APIs directly via Postman/cURL.
  - Attempting to submit massive payloads to forms.
  - Checking if they can access data belonging to a different tenant/user (if applicable).

### Backup Restore Drills
- As stated in the Backup Security document, the ability to restore data from encrypted backups must be tested on a recurring schedule (e.g., quarterly) to verify the integrity of the backups and the validity of the recovery documentation.
