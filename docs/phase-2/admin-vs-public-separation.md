# Admin vs. Public UI Separation

## Visual Distinctions
While the admin panel and public website share the same core design system (typography, primary colors, component shapes), they must feel distinct so staff members instantly know they are in the workspace.

### 1. Background Color
- **Public UI:** Base background is `#0F0F0F` (True dark, cinematic).
- **Admin UI:** Base background is `#141414` or `#1A1A1A` (Slightly lighter dark mode). This reduces eye strain for data-entry tasks and makes form inputs (`#0F0F0F` or `#222222`) stand out more clearly.

### 2. Layout Structure
- **Public UI:** Center-aligned, constrained max-width (`1440px`), focusing on massive imagery and vertical scrolling.
- **Admin UI:** Fluid width (`100vw`) with a fixed left sidebar. Designed to maximize horizontal space for data tables and complex forms.

### 3. Typography Density
- **Public UI:** Loose, airy, emotional. Large headlines, ample line height, designed for scanning and aesthetic pleasure.
- **Admin UI:** Dense, functional. Smaller base font sizes for data tables to fit more information on screen. Tighter padding within table cells and form rows.

### 4. Imagery Treatment
- **Public UI:** Massive, edge-to-edge backdrops. High-resolution posters.
- **Admin UI:** Thumbnails only. Posters are restricted to small 40x60px avatars within data tables to confirm the correct asset was uploaded, saving vertical space.

## Shared Elements
To maintain brand consistency and reduce development overhead, the following components are shared exactly between both domains:
- Primary Brand Red (`#E50914`) for primary actions.
- Form Inputs (Text fields, selects, checkboxes).
- Toast Notifications / Alerts.
- Button shapes and interaction states.
