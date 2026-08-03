# End-to-End Testing Strategy

## Critical User Journeys (CUJs)

End-to-End (E2E) tests simulate a real user driving a browser against a fully deployed environment. Because they are slow and prone to flakiness, we restrict them strictly to high-value, critical paths.

### The "Must-Pass" Public Flows

1. **The Trailer Playback Flow:**
   - Load homepage -> Click a movie poster -> Movie detail page loads -> Click 'Play Trailer' -> Verify the video player modal opens and attempts to load the iframe/video element.
   - *Failure Impact: Core product value is broken.*

2. **The Search Discovery Flow:**
   - Load homepage -> Focus search bar -> Type "Action" -> Press Enter -> Verify results page loads -> Verify URL updates to `?q=Action` -> Click a result -> Verify navigation succeeds.
   - *Failure Impact: Users cannot find content.*

3. **The Category/Genre Browsing Flow:**
   - Load homepage -> Open navigation menu -> Click "Sci-Fi" -> Verify genre page loads with a list of movies -> Verify pagination works.
   - *Failure Impact: Content discovery is broken.*

### The "Must-Pass" Admin Flows

4. **The Admin Login Flow:**
   - Navigate to `/admin` -> Enter valid credentials -> Submit -> Verify redirection to dashboard -> Verify secure cookie is set.
   - *Failure Impact: Editors cannot manage the site.*

5. **The Content Publish Flow:**
   - Login -> Click 'New Movie' -> Fill required fields (Title, Slug) -> Upload dummy poster -> Click 'Publish' -> Verify success toast -> Navigate to public URL -> Verify the new movie is visible.
   - *Failure Impact: Operations are halted.*

### Execution
These tests should run against a "Staging" environment before deploying to Production, using a tool like Playwright.
