# QA and Validation Documentation

## Documenting the Checklists

While automation handles most testing (Phase 13), human validation is still required for complex features and final sign-offs.

### The Manual Release Checklist
Before a major new feature (e.g., User Accounts) is promoted to Production, QA must manually verify items that automation struggles with:
- [ ] Does the UI feel responsive on an actual iPhone Safari browser (not just an emulator)?
- [ ] Do the animation transitions stutter on a lower-end device?
- [ ] Is the contrast of the new dark mode buttons acceptable in a bright room?

### Smoke Test Checklists
A concise list of 5 things to check immediately after *any* deployment:
1. Does the homepage load?
2. Does the search bar return results?
3. Can you play a trailer?
4. Can you log into the admin panel?
5. Do the Google Analytics network requests fire on page load?

### SEO Validation Checks
- Documentation for the SEO team on how to use tools (like Screaming Frog or Ahrefs) to crawl the Staging environment and verify that the programmatic canonical tags and XML sitemaps are still rendering correctly before a major release.

### Maintaining the Checklists
Checklists should live in GitHub Issue Templates or Pull Request Templates, so they are automatically injected into the developer workflow, rather than hiding in a forgotten Wiki page.
