# Mobile Performance Strategy

## Mobile-First Rules

Mobile users often face hardware and network constraints. The architecture must actively protect the mobile experience.

### Low-End Device Awareness
- Minimize JavaScript execution time. Low-end CPUs struggle with heavy parsing and execution, leading to unresponsive pages.
- Avoid complex CSS filters (blur, drop-shadow) over large areas, as these are computationally expensive for mobile GPUs.

### Slow Network Awareness
- Assume a 3G or spotty 4G connection as the baseline for performance testing.
- Aggressively chunk and defer non-critical assets to ensure the core content loads even on a weak connection.

### Reduced Motion Support
- Respect the `prefers-reduced-motion` media query.
- Disable auto-playing background videos, parallax effects, and heavy transitions if the user has requested reduced motion. This saves battery and CPU cycles.

### Touch Target Responsiveness
- Ensure all interactive elements (buttons, links, carousel arrows) have a minimum touch target size of 44x44 pixels.
- Provide instant visual feedback on touch (`:active` state) without the 300ms delay.

### Image/Video Restraint on Cellular Networks
- **Responsive Images:** Ensure the `srcset` attribute provides suitably small image files for narrow mobile screens. Never serve a 2000px wide image to a 375px wide screen.
- **Video:** Default to lower-resolution video streams on mobile devices unless the user explicitly requests higher quality or connects to Wi-Fi (if detectable). Do not autoplay large videos on mobile cellular connections.

### Simplified Mobile Layouts
- Design mobile layouts to require fewer DOM nodes. Deeply nested DOM structures slow down rendering and styling calculations.
- Consider removing secondary, non-critical content entirely on mobile views rather than just hiding it with `display: none` (which still requires the browser to parse and render it in memory).
