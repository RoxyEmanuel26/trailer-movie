# Final Accessibility Review

## Overview
A modern website must be usable by everyone, regardless of physical or cognitive ability. This audit confirms baseline compliance with web accessibility standards (WCAG).

## Verification Checklist

### 1. Keyboard Accessibility
*   [ ] Verify that every interactive element (links, buttons, form fields, video controls) can be reached using the `Tab` key.
*   [ ] Verify that the tab order follows the logical visual flow of the page.
*   [ ] Verify that no "keyboard traps" exist (e.g., a modal that cannot be exited via the `Esc` key or tabbed out of).

### 2. Focus Management
*   [ ] Verify that focused elements have a clear, highly visible focus indicator (outline).
*   [ ] Verify that when a modal opens, focus is moved into the modal, and when it closes, focus returns to the triggering element.

### 3. Screen Reader Support
*   [ ] Verify that all non-decorative images (e.g., movie posters) have descriptive `alt` text.
*   [ ] Verify that icon-only buttons (e.g., a magnifying glass for search, an 'X' to close) have `aria-label` attributes indicating their function.
*   [ ] Verify semantic HTML structure (using `<main>`, `<nav>`, `<header>`, `<footer>`, and proper heading hierarchy `<h1>` to `<h6>`).

### 4. Contrast and Readability
*   [ ] Verify that text contrast against its background meets WCAG AA standards (minimum 4.5:1 for normal text).
*   [ ] Verify that the site remains usable when text is zoomed to 200%.

### 5. Form Accessibility
*   [ ] Verify that all form inputs (e.g., search bar, admin forms) have associated `<label>` elements or `aria-labelledby` attributes.

### 6. Motion and Media
*   [ ] Verify that any auto-playing video (if used) can be easily paused or stopped.
*   [ ] Verify that CSS animations respect the `prefers-reduced-motion` media query for users sensitive to motion.
