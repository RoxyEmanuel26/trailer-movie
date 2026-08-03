# Final QA Review Checklist

## The Last Pass

While automated tests run continuously, a final, manual QA sweep of the Release Candidate (RC) environment is mandatory.

### Critical User Journeys (Public)
- [ ] Load the homepage on Desktop and Mobile.
- [ ] Type "Action" into the search bar; verify results appear within 500ms.
- [ ] Click a movie card, navigate to the Movie Detail page.
- [ ] Click "Play Trailer"; verify the video player opens and streams smoothly.
- [ ] Navigate through the Taxonomy (e.g., Click the "Sci-Fi" genre pill and verify the filtered list).
- [ ] Intentionally trigger a 404 (e.g., visit `/movies/does-not-exist`); verify the custom 404 page renders.

### Admin Workflows
- [ ] Log in with a valid Editor account.
- [ ] Create a new Draft movie. Upload a poster image.
- [ ] Publish the movie. Verify it appears on the public staging site.
- [ ] Soft-delete the movie. Verify it disappears from the public staging site.
- [ ] Log in with an invalid password; verify the error state and rate limiting.

### SEO & Performance Spot Checks
- [ ] View Page Source on the Homepage; verify `<title>` and `<meta name="description">` are present.
- [ ] View Page Source on a Movie Detail page; verify Schema.org JSON-LD structured data is present.
- [ ] Run a quick Lighthouse audit in Chrome DevTools to flag any glaring regressions.
