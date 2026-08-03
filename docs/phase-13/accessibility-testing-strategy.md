# Accessibility Testing Strategy

## Validating Inclusive Design

Accessibility (a11y) testing ensures the platform is usable by everyone, regardless of physical or cognitive ability. It combines automated catching of common errors with manual verification of complex interactions.

### Automated Checks (The Baseline)
- Integrate a tool like `axe-core` into the E2E or Integration test suite (e.g., `cypress-axe` or `@axe-core/playwright`).
- During E2E test runs, scan every visited page for WCAG violations.
- **Focus Areas for Automation:**
  - Color contrast ratios.
  - Presence of `alt` text on all movie posters.
  - Presence of ARIA labels on icon-only buttons (like the Play or Mute buttons).
  - Valid HTML landmark structure (`<main>`, `<nav>`).

### Manual Keyboard Navigation Checks
- Automated tools cannot tell if a keyboard flow makes sense.
- **QA Protocol:** A tester must navigate the entire site using *only* the Tab, Shift+Tab, Enter, and Space keys.
- They must verify that focus states are highly visible and that focus is not trapped (e.g., inside the video player modal).

### Screen Reader Structure Checks
- **QA Protocol:** Periodically review the site using VoiceOver (macOS) or NVDA (Windows) to ensure the logical reading order matches the visual order, and that dynamically changing content (like search results popping up) is announced to the user.

### Motion Reduction Checks
- Verify that if the user's OS is set to `prefers-reduced-motion`, any auto-playing background videos fall back to a static image, and UI transitions become instantaneous.
