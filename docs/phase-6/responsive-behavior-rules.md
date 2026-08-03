# Responsive Behavior Rules

The platform must adopt a strict "Mobile-First" design approach, as over 70% of entertainment browsing occurs on mobile devices.

## 1. Mobile Layout (Base Viewport)
- **Navigation:** Header collapses to a hamburger menu.
- **Grids:** Poster grids are 2 columns wide.
- **Hero Video:** The video player scales to 100% viewport width, maintaining a 16:9 aspect ratio. The backdrop image is heavily cropped or hidden to save screen space.
- **Layout Shift:** Ad units must have predefined `min-height` css rules to prevent the layout from jumping when the ad loads, which is doubly disruptive on small screens.

## 2. Tablet Layout (`md` breakpoint)
- **Grids:** Expand to 4 columns.
- **Navigation:** The hamburger menu expands to show top-level links if horizontal space permits.

## 3. Desktop Layout (`lg` / `xl` breakpoints)
- **Grids:** Expand to 6 columns.
- **Hero Video:** The video player has a `max-width` (e.g., 1200px) so it doesn't become overwhelmingly massive on ultrawide monitors. The backdrop image takes full prominence behind it.
