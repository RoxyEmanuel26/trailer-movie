# Design Principles

## 1. Cinematic First
The content is the hero. The UI should fade into the background. Use dark mode as the default theme to mimic a theater environment. High-quality imagery (posters, backdrops) and video should take up maximum real estate without overwhelming the layout.

## 2. Uncompromising Speed
A premium experience is a fast experience. Visual flourishes, complex animations, or heavy UI assets must never compromise Time to Interactive (TTI) or Largest Contentful Paint (LCP). The design must look good even before images load via graceful skeleton states.

## 3. High Contrast, Low Clutter
Minimize cognitive load. Strip away unnecessary borders, boxes, and decorative elements. Use spacing and typography to create hierarchy instead of hard dividing lines. Content must have high contrast to remain legible on varied background imagery.

## 4. Mobile-Native Mindset
Mobile is not an afterthought; it is the primary consumption environment. Touch targets must be generous (minimum 44x44px). Horizontal scrolling (carousels) is preferred for lists of movies on mobile to preserve vertical reading flow.

## 5. SEO & Accessibility by Design
Visuals must map cleanly to semantic HTML (`h1`-`h6`, `nav`, `main`, `article`). Contrast ratios must pass WCAG AA standards. The design system must not rely purely on color to convey meaning.
