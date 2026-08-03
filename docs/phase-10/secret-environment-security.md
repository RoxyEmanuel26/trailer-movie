# Secret and Environment Variable Security

## Secret Management

Improper handling of secrets is a leading cause of severe security breaches.

### API Key Storage Expectations
- Never hardcode API keys, database credentials, or cryptographic secrets in the source code.
- Always load these values from environment variables (`.env` files in development, secure secret managers in production).

### Environment Variable Safety Rules
- `.env` files must be explicitly added to `.gitignore` and never committed to the repository.
- Provide a `.env.example` file with dummy values to document required variables without exposing secrets.

### Rotation Expectations
- Design the application to support the seamless rotation of secrets.
- If a database password or external API key is compromised, changing the environment variable and restarting the service must be the only required action.

### Exposure Prevention Rules
- Limit access to production environment variables strictly to DevOps personnel or the automated CI/CD pipeline. Developers should generally use separate staging or development keys.

### Secrets in Logs Avoidance
- Implement log sanitization middleware. Ensure that incoming request bodies, query parameters, or outgoing error messages do not accidentally print passwords, API keys, or session tokens to the application logs.

### Secrets in Client-Side Bundles Prevention
- Frameworks (like Next.js or Vite) have specific prefixes (e.g., `NEXT_PUBLIC_`, `VITE_`) to expose variables to the browser.
- **Strict Review:** Ensure NO sensitive secret (database URLs, private API keys) is ever prefixed with these public markers. Treat all client-side code as fully readable by the public.

### Deployment Secret Handling
- Use the hosting provider's secure secret management tools (e.g., Vercel Environment Variables, AWS Secrets Manager, GitHub Actions Secrets) to inject secrets at build or runtime, rather than passing them via insecure channels.
