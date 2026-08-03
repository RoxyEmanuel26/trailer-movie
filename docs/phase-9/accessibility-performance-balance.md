# Accessibility-Performance Balance

## Coexistence of Speed and Inclusion

Performance optimizations must never come at the cost of accessibility. The two disciplines often align, but care must be taken where they intersect.

### Semantic HTML with Low Cost
- The most performant approach is often the most accessible. Rely heavily on semantic HTML (`<nav>`, `<main>`, `<article>`, `<button>`, `<a>`) rather than building custom components out of `<div>`s with heavy JavaScript ARIA management. Semantic HTML is parsed instantly and understood natively by assistive technologies.

### Motion Reduction Support
- **Performance Benefit:** Disabling heavy animations saves battery and CPU.
- **Accessibility Benefit:** Respecting `prefers-reduced-motion` is critical for users with vestibular disorders.
- **Implementation:** Wrap complex animations in media queries. This is a win-win for both areas.

### Focus State Responsiveness
- Keyboard navigation (tabbing through interactive elements) must feel instantaneous.
- Ensure that CSS `:focus` and `:focus-visible` styles do not rely on heavy transitions or JavaScript event listeners that could delay the visual feedback of where the user's focus currently lies.

### Screen Reader Friendliness Without Heavy Overhead
- Avoid "clever" CSS hacks (like clipping text to 1px to hide it visually but keep it for screen readers) if simpler alternatives exist (like `sr-only` utility classes).
- Ensure that dynamic content updates (e.g., error messages on a form) are announced to screen readers using `aria-live` regions, but do not flood these regions with constant, unnecessary updates that might degrade the user experience or cause performance hiccups.

### Keyboard Accessibility Impact on Performance
- Custom JavaScript-driven components (like complex dropdowns or custom video controls) require extensive event listeners (`keydown`, `keyup`) to manage focus and behavior.
- To maintain performance, ensure these event listeners are optimized, delegated where appropriate, and do not cause unnecessary re-renders when keys are pressed. Prefer native HTML elements (like `<select>` or native `<video>` controls with light restyling) where feasible, as they are inherently accessible and highly performant.
