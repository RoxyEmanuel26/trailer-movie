# Trailer Management Workflow

## Managing Video Assets

Trailers are the core value proposition of the platform. Their management must be robust and handle external dependencies gracefully.

### Adding a Trailer
- **Input:** Editor provides a URL (e.g., YouTube, Vimeo) or an internal asset ID (if self-hosted).
- **Validation:** The system attempts to parse the URL. For YouTube, it extracts the video ID. It should ping the provider's oEmbed or API to verify the video actually exists and is public before allowing the save.

### Multiple Trailer Sources
- A single movie can have multiple trailers (e.g., "Teaser 1", "Official Trailer", "Red Band Trailer").
- **Workflow:** Editors use a repeatable block/list UI to add multiple trailer objects to a movie.

### Primary vs. Secondary
- Editors must explicitly designate one trailer as the `Primary`. 
- The Primary trailer is the one that autoplays on the homepage or is featured at the top of the movie detail page.

### Replacing and Removing
- If a primary trailer is taken down by YouTube (link rot), the editor must be able to easily swap the ID.
- Removing a trailer object simply deletes the relationship from the movie. If it was the *only* trailer, the publish validation rules may block the save if a primary trailer is strictly required for that content type.

### Handling Missing/Invalid Sources (Monitoring)
- The workflow architecture relies on the System Monitoring (Phase 11) to run periodic background checks on all published YouTube IDs. If the API returns a 404 (video deleted), it flags the trailer in the CMS dashboard for editorial review.
