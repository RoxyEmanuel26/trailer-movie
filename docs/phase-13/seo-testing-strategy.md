# SEO Testing Strategy

## Validating Search Viability

SEO is fragile. A single malformed tag can de-index the site. SEO testing must be automated and treated as a release blocker.

### Automated SEO Validation (Pre-Deployment)

1. **Snapshot Testing the `<head>`:**
   - Use unit/integration tests to render key pages (Homepage, Movie Detail) to a string and run them through DOM assertions.
   - Assert exactly one `<title>` tag exists.
   - Assert exactly one `<meta name="description">` exists.
   - Assert exactly one `<link rel="canonical">` exists and matches the expected format.

2. **Indexability Checks:**
   - Assert that `meta robots` does *not* contain `noindex` on standard public routes.
   - Assert that utility routes (e.g., `/search`, `/login`) *do* contain a `noindex` directive to prevent index bloat.

3. **Structured Data (JSON-LD) Validation:**
   - Extract the JSON-LD payload from the rendered Movie Detail page during an integration test.
   - Assert it parses as valid JSON.
   - Assert it matches the `schema.org/Movie` requirements (contains name, image, director, and potentially `VideoObject` for the trailer).

### Environment Configuration Checks
- Ensure that the Staging environment *always* serves a global `X-Robots-Tag: noindex` header to prevent Google from indexing the test environment and penalizing the production site for duplicate content.

### Broken Internal Links
- Run a crawler script during the CI/CD pipeline (e.g., using a tool like `broken-link-checker`) against a statically generated build to ensure no internal navigation links or standard movie links result in 404s.
