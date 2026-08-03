# Visual Regression Strategy

## Catching Cosmetic Drift

Visual regression testing compares screenshots of the UI to detect unintended CSS or layout changes that functional tests miss.

### When to Use Visual Testing
Visual testing is highly effective but can be very brittle if used incorrectly (e.g., failing because a dynamic movie poster changed). We use it selectively on static or highly controlled mock data.

### Critical Areas for Visual Comparison

1. **Component Library (Storybook):**
   - This is the best place for visual testing. Capture screenshots of isolated components (Buttons, Cards, Modals) in various states (hover, disabled, error). If a global CSS change alters a button's padding, the test catches it.

2. **The Homepage (Seeded Data):**
   - Using a consistent, seeded test database, capture a full-page screenshot of the homepage across Desktop, Tablet, and Mobile viewports. This catches overlapping text or broken grid layouts.

3. **Empty & Error States:**
   - These states are rarely seen by developers during normal workflows. Capture the "404 Page," the "Zero Search Results" page, and the "Offline" fallback page to ensure they remain branded and functional.

### What NOT to Visually Test
- **Dynamic Content:** Do not run visual tests against live production data where the order of "Trending Movies" changes hourly. It will result in constant false positives.
- **Admin Dashboard Data Tables:** A functional E2E test is better here; visual tests will fail every time a new row is added.
