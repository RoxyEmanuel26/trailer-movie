# Performance Regression Control

## Preventing Slowdowns

As the application evolves, new features and dependencies can silently degrade performance. Strict controls must be in place to prevent regressions.

### Performance Budget Thresholds
- Establish hard limits for critical metrics in the CI/CD pipeline (e.g., using Lighthouse CI).
  - Maximum initial JavaScript bundle size: < 150KB (gzipped).
  - Maximum LCP in synthetic tests: < 2.5s.
  - Maximum CLS: < 0.1.
- If a pull request exceeds these budgets, the build should fail, requiring explicit justification or optimization before merging.

### Review Process Before Adding Heavy Dependencies
- Any proposal to add a new npm package, especially a UI component library or utility library, must undergo a bundle size review.
- Developers must justify why a third-party library is needed over native browser APIs or a smaller alternative.

### Media Size Limits
- Implement server-side checks or CMS constraints to prevent admins from uploading unoptimized, massive media files (e.g., blocking 10MB JPEGs).
- Rely on automated image optimization pipelines to enforce maximum dimensions and compression ratios.

### Component Complexity Controls
- Encourage breaking down massive, monolithic components into smaller, more focused components. This aids in code splitting and reduces the amount of JavaScript that needs to be parsed for a specific interaction.

### Testing Rules Before Release
- Conduct performance testing on staging environments that closely mirror production (including realistic network throttling and CPU throttling in DevTools).
- Test on actual mobile devices, not just desktop browser emulators, before major feature releases.

### Regression Alert Ideas
- Configure alerts in the RUM (Real User Monitoring) tool to trigger notifications (e.g., via Slack or email) if the 75th percentile of LCP or INP degrades by more than 20% compared to the previous week's baseline.
