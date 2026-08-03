# Feature Flag and Safe Rollout Strategy

## Hiding Work in Progress

We decouple *Deployment* (pushing code to production) from *Release* (making features visible to users).

### Feature Flag Readiness
- Complex, multi-sprint features (e.g., A new algorithm for Movie Recommendations) must be wrapped in a feature flag from day one.
- **Example:** `if (env.ENABLE_RECOMMENDATIONS) { return <Recommendations /> }`
- This allows developers to continuously merge their progress into `main` and deploy to production without exposing broken UI to users.

### Partial Rollouts (Canary)
- When turning on a major feature, do not activate it for 100% of traffic immediately.
- **Strategy:** If the infrastructure allows, route 5% of traffic to the new feature. Monitor Sentry for error spikes. If errors remain flat, increase to 25%, 50%, and 100%.

### The Emergency Kill Switch
- Feature flags act as instant rollbacks for isolated features. If the new Recommendations widget is causing the database to lock up in production, an Admin can simply flip the environment variable or LaunchDarkly toggle to `false`. The UI instantly reverts to the old state without requiring a new Vercel deployment.

### Cleanup
- Feature flags are technical debt. Once a feature is fully rolled out and stable for 2 weeks, the flag logic must be deleted from the codebase.
