# Manual QA Strategy

## The Human Element

Automated tests verify that the code *works*. Human QA verifies that the product feels *good*. Manual testing is reserved for subjective, complex, or high-risk areas where automation is inadequate.

### Where Manual Review is Required

1. **Content Feel and Polish:**
   - Does the animation for the hero carousel feel smooth, or is it jarring?
   - Is the typography readable on a small, low-resolution screen?

2. **Trailer Playback Quality (Edge Cases):**
   - Does the video player handle orientation changes on a mobile device gracefully?
   - What happens if the user receives a phone call while a trailer is playing on mobile? Automation struggles with OS-level interruptions.

3. **Search Relevance Perception:**
   - Automation can prove search *returns results*, but human QA must periodically review if the results *make sense*. If I search "Batman", is "The Dark Knight" at the top, or is an obscure 1940s serial ranking higher?

4. **Copy Quality and Tone:**
   - Are the error messages friendly and helpful, or robotic?
   - Does the taxonomy (genre naming) make logical sense to a film fan?

5. **Exploratory Testing (The "What If" Protocol):**
   - QA engineers should spend time trying to break new features in unexpected ways (e.g., clicking "Publish" and mashing the Escape key simultaneously). This uncovers edge cases that developers didn't anticipate to write automated tests for.
