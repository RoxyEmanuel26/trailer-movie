# Integration Checkpoint Design

## Verifying the Seams

Bugs rarely live in isolated functions; they live at the boundaries between systems. Integration checkpoints are mandatory stops to verify these boundaries.

### Critical Checkpoints

1. **Database + API Checkpoint:**
   - *Verification:* Can the API successfully execute a complex join (e.g., Fetching a Movie with its Genres and Cast) within the expected latency budget (<100ms)?

2. **API + Admin Panel Checkpoint:**
   - *Verification:* Can the React frontend send a `POST` request with multipart form data (a movie poster) to the API, have the API upload it to the bucket, and return the CDN URL correctly?

3. **Auth + Admin Routes Checkpoint:**
   - *Verification:* If a user with the 'Viewer' role attempts to call a `DELETE` endpoint on the API, does the middleware correctly intercept and return a `403 Forbidden` before the controller logic executes?

4. **SEO + Public Pages Checkpoint:**
   - *Verification:* When the Next.js page renders on the server, is the HTML string fully populated with `<meta name="description">` before it hits the client browser? (Test with JavaScript disabled).

### Rule of Checkpoints
Implementation of a new wave cannot begin until the integration checkpoints of the previous wave have been explicitly signed off by a human reviewer or passing automated E2E test.
