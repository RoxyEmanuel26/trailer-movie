# Deployment Security

## Guarding the Pipeline

The deployment pipeline has the keys to the production environment. If the pipeline is compromised, the entire system is compromised.

### Least Privilege Access
- The CI/CD runner (e.g., GitHub Actions) must be granted the absolute minimum permissions required to deploy.
- It should not have full Admin rights to the cloud provider. It should only have permission to update specific serverless functions and upload to specific buckets.

### Build Pipeline Secret Protection
- Never echo secrets to the CI console.
- Ensure the CI provider is configured to mask secrets in logs automatically.
- Restrict who can trigger deployments or modify CI workflows to Senior Engineers only.

### Separation of Staging and Production
- Staging and Production must exist in completely isolated logical environments (e.g., different AWS accounts or different Vercel projects).
- A vulnerability exploited in Staging must provide zero lateral movement capabilities into the Production environment.

### Dependency Risk Controls (Supply Chain Security)
- Run automated scans (e.g., `npm audit`, Snyk) during the build phase.
- If a critical CVE is found in a dependency, the build must fail immediately, blocking the deployment.

### Admin Access Protections
- Engineers should not have persistent SSH or direct database access to Production.
- Direct database access (for debugging or manual data fixes) should require connecting through a secure Bastion host, a VPN, or a zero-trust proxy (like Tailscale or Cloudflare Access), with all queries logged and audited.
