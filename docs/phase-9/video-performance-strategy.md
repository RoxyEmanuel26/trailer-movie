# Video Performance Strategy

## Efficient Trailer Loading

Video players are extremely resource-heavy. They must be managed carefully to prevent them from degrading the initial page load performance.

### Thumbnail-First Strategy
- **Implementation:** The video player itself (whether custom or embedded like YouTube/Vimeo) should **never** load on the initial page load.
- **Initial State:** Display a high-quality static thumbnail image with a prominent "Play" button overlay. This acts as a facade.

### User-Triggered Loading Behavior
- **Action:** Only when the user clicks the "Play" button should the actual video player scripts and iframe be injected into the DOM.
- **Transition:** The transition from the static thumbnail to the active video player must be visually seamless.

### Autoplay Expectations
- **Strict Limitation:** Avoid autoplaying videos with sound.
- **Muted Autoplay (Hero Backgrounds):** If a muted, autoplaying video is used as a background element, it must be short, highly compressed (low bitrate), and ideally paused if it scrolls out of view or if the user has enabled "prefers-reduced-motion".

### Embedded Player Performance Concerns
- If using third-party embeds (YouTube, Vimeo):
  - Use lite-embed techniques (facades) to delay loading third-party scripts.
  - Be aware that third-party players introduce significant external JavaScript, which must be deferred until interaction.

### Fallback Handling
- **Missing Video:** If a trailer URL is missing or broken, gracefully hide the play button and display a message indicating the trailer is unavailable, rather than rendering a broken player.
- **Slow Connection:** Ensure the video player uses adaptive bitrate streaming (HLS/DASH) so the quality degrades gracefully on slow connections rather than buffering endlessly.
