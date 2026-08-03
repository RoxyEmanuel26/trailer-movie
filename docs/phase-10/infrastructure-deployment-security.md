# Infrastructure and Deployment Security

## Securing the Environment

Security must extend beyond the application code to the infrastructure it runs on and how it gets deployed.

### Least-Privilege Deployment Access
- Developers should not have direct SSH access to production servers or direct write access to the production database.
- All deployments and infrastructure changes must happen via automated CI/CD pipelines (e.g., GitHub Actions) or Infrastructure as Code (IaC) tools (e.g., Terraform).

### Production vs Staging Isolation
- The staging environment must be completely isolated from production. They must not share databases, caching layers, or sensitive API keys.
- Staging environments should ideally contain anonymized or synthetic data, not a direct clone of production user data.

### Build Pipeline Security
- Restrict who can push to the `main` or `production` branches (require PR reviews).
- Ensure the CI/CD pipeline environment is secure. Do not log secrets during the build process.

### Dependency Update Safety
- Implement automated dependency vulnerability scanning (e.g., Dependabot, Snyk).
- Regularly update third-party libraries to patch known security flaws.
- Avoid introducing new dependencies without evaluating their security posture and maintenance history.

### Secret Injection at Deploy Time
- As outlined in the Secret Security document, environment variables must be injected into the application securely at runtime or build time by the hosting provider's secret manager, not committed to the repository.

### Rollback Safety
- Maintain the ability to instantly roll back to a previously known-good deployment if a newly deployed version introduces a critical security vulnerability or functional bug.
- Ensure database migrations are designed carefully so that code rollbacks do not break against a newer database schema.
