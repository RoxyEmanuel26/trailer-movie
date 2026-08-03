# Performance Philosophy

## Core Principles

The performance strategy for the trailer movie website is built upon the following core principles:

### What does "fast" mean for this product?
"Fast" means the immediate availability of visual content and interactivity. For a movie trailer site, this translates to displaying movie posters and titles instantly, and ensuring the video player (or its thumbnail) is ready without noticeable delay. The perceived speed of the site should feel seamless, even if background assets are still loading.

### Which experiences matter most to optimize?
1. **Initial Page Load:** The first impression is critical. The Above-The-Fold (ATF) content must render instantly.
2. **Video Playback Initiation:** The transition from clicking "Play" to the video starting must be frictionless.
3. **Navigation:** Browsing between movie categories, searching, and opening detail pages must feel instantaneous and fluid, avoiding full-page reloads.

### What should be prioritized over perfection?
- **Perceived Performance over Raw Metrics:** While Core Web Vitals are important, the *feeling* of speed (through skeletons, placeholders, and immediate interaction feedback) is prioritized over achieving a perfect 100 on synthetic benchmarks if the two conflict.
- **Content Availability over Advanced Interactivity:** Displaying the movie data (poster, title, synopsis) takes precedence over loading heavy interactive widgets or complex client-side states.

### What performance sacrifices are unacceptable?
- **Layout Shifts:** Elements jumping around as images or ads load is strictly unacceptable. It ruins the premium feel of a movie site.
- **Unresponsive UI (High INP):** Buttons, links, or search bars that do not respond immediately to user input are unacceptable.
- **Heavy Mobile Penalties:** Ignoring mobile performance in favor of a desktop-heavy experience is unacceptable. The mobile experience must be first-class, respecting bandwidth and device constraints.
