# Dark Mode Guidelines

## Philosophy
This product is **Dark Mode Exclusive**. Because the primary content consists of vibrant movie posters and video players, a dark background provides the highest contrast and most cinematic experience. There is no "Light Theme".

## Background & Surface Hierarchy
To prevent the interface from feeling flat, we use distinct shades of gray/black to establish elevation and hierarchy.

1. **Base Background (`#0F0F0F`):** The absolute bottom layer. The body of the page. It is not pure black, as pure black strains the eyes.
2. **Surface Level 1 (`#181818`):** Elements that sit on top of the background, such as Sidebar menus, Cards, and dropdown menus.
3. **Surface Level 2 (`#222222`):** Interactive states (hovering over a card) or elevated elements (Modals, sticky headers).
4. **Surface Level 3 (`#333333`):** Borders, dividers, and input backgrounds.

## Shadow Behavior
Drop shadows (`box-shadow`) are notoriously difficult to see on dark backgrounds. 
- **Rule:** Do not rely on shadows to separate elements. 
- **Alternative:** Use Surface color changes (from Level 1 to Level 2) and subtle 1px borders (Surface Level 3) to distinguish overlapping elements. If shadows are used, they must be very dark and spread widely to create a subtle glow rather than a harsh line.

## Border Usage
- Use borders sparingly. When necessary to separate content (e.g., table rows in the admin panel or distinct sections on a movie page), use a subtle `#333333` line. Hard white borders must be avoided.

## Image Treatment
- **Bright Images:** Highly saturated or predominantly white posters can be glaring against a dark background. The UI must accommodate this by ensuring borders and padding provide a soft transition. Do not artificially darken movie posters.
