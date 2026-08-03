# Accessibility and Usability

An accessible site expands the audience and improves SEO.

## 1. Keyboard Navigation
- The entire site must be navigable via the `Tab` key.
- **Visible Focus:** When a poster card or navigation link receives keyboard focus, it must have a high-contrast outline (e.g., a bright brand-color ring) to show the user where they are. 

## 2. Screen Reader Support
- **Alt Text:** Every movie poster must have descriptive `alt` text (e.g., `alt="Official Poster for Dune: Part Two"`). 
- **ARIA Labels:** Icon buttons (like the Hamburger menu or the Search magnifying glass) must have `aria-label="Open Search"` attributes so screen readers can announce them.

## 3. Visual Usability
- **Contrast:** Because the site uses an exclusive Dark Mode, text must be stark white or very light grey against the dark backgrounds. Avoid medium-grey text on dark-grey backgrounds, which fails WCAG contrast ratios.
- **Touch Targets:** On mobile, buttons and links (especially in the footer) must have a minimum touch target size of 44x44px to prevent accidental misclicks.

## 4. Motion
- Hover animations (scaling up posters) should respect the `prefers-reduced-motion` CSS media query, disabling the scale effect for users who have requested reduced motion in their OS settings.
