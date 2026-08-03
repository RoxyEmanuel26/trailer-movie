# Accessibility Guidelines (A11y)

## Contrast Expectations
- **Text:** All text must meet WCAG 2.1 AA contrast ratio requirements (`4.5:1` for normal text, `3:1` for large text).
- **Backgrounds:** When overlaying text on movie posters or backdrops (which vary in brightness), a dark gradient overlay or solid background container must be used to ensure the text remains legible regardless of the image underneath.

## Keyboard Navigation
- The entire site (public and admin) must be fully navigable using only the `Tab`, `Enter`, `Space`, and Arrow keys.
- **Focus Rings:** Never set `outline: none` without providing an alternative, highly visible focus state.
- **Skip to Content:** Include a hidden "Skip to main content" link at the very top of the DOM for screen reader and keyboard users to bypass the navigation menu.

## Screen Reader Expectations
- **Alt Text:** Every movie poster MUST have an `alt` attribute (e.g., `alt="Dune: Part Two Movie Poster"`).
- **ARIA Labels:** Icon-only buttons (like a search magnifying glass or a hamburger menu) must have `aria-label` attributes explaining their function.
- **Forms:** Every `input` must have an associated `<label>` (visually hidden if necessary, but present in the DOM).

## Touch Target Sizes
- To ensure mobile-friendliness, all clickable elements (buttons, links, icon buttons) must have a minimum touch target area of `44x44px`.

## Motion Reduction
- Respect the user's OS-level motion preferences. Use CSS media queries (`@media (prefers-reduced-motion: reduce)`) to disable non-essential animations (e.g., scaling on hover, structural transitions, looping background videos).
