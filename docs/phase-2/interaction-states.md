# Interaction States & Motion

## Interaction States

### Hover
- **Buttons:** Background color darkens slightly. Cursor changes to pointer.
- **Movie Cards:** Subtle scale transformation (`scale: 1.05`) over `200ms ease-out`. Drop shadow deepens. A primary red Play icon fades in over the center of the poster.
- **Links (Text):** Text color transitions from Secondary (`#AAAAAA`) to Primary (`#FFFFFF`).

### Focus
- **Forms/Inputs:** The border color changes to Primary Brand Red (`#E50914`). A subtle `box-shadow` or `ring` appears to indicate active typing focus.
- **Keyboard Navigation:** Every focusable element (links, buttons, cards) must have a visible `outline` when navigated via the `Tab` key. (Do not suppress `outline` for keyboard users).

### Active / Pressed
- **Buttons:** Background color darkens further than the hover state. The element physically depresses slightly (`scale: 0.98`) to mimic a tactile button press.

### Loading States
- **Page Load:** Skeleton loaders take the place of images and text blocks. They should pulse smoothly (`opacity: 0.5` to `1` over `1.5s infinite`).
- **Button Action:** The button text is replaced by a centered, spinning loader (spinner), and the button becomes disabled to prevent double-submissions.

### Disabled States
- **Buttons/Inputs:** Opacity drops to `0.5`. Cursor changes to `not-allowed`. Background color shifts to Surface Level 3 (`#333333`).

## Motion Limits (Animations)
- **Rule:** Motion should feel fast and intentional, never sluggish.
- **Durations:** 
  - Micro-interactions (hover, color change): `150ms - 200ms`
  - Structural transitions (modal open, dropdown reveal): `250ms - 300ms`
- **Easing:** Prefer `ease-out` for elements entering the screen (decelerating) and `ease-in` for elements leaving the screen (accelerating).
- **Limit:** Avoid complex parallax or heavy scroll-linked animations that cause jitter or drop frames on low-end devices.
