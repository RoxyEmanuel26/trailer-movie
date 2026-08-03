# Color System

## Core Philosophy
The palette is dark by default. Colors are used sparingly for calls to action (CTAs), system states, and focus states. The interface must not clash with highly colorful movie posters.

## Primary Colors
Used for the main brand identity, primary buttons, and active states.
- **Brand Primary:** `#E50914` (A vibrant, cinematic red)
- **Brand Hover:** `#B20710` (Darker shade for interaction states)

## Surface & Background Colors
Used to establish depth and structure in a dark-mode-first environment.
- **Background Base:** `#0F0F0F` (True dark, used for the main page body)
- **Surface Level 1:** `#181818` (Cards, sidebars, secondary containers)
- **Surface Level 2:** `#222222` (Hover states for cards, elevated modals)
- **Surface Level 3:** `#333333` (Borders, dividers, subtle active states)

## Text Colors
Optimized for readability against dark backgrounds.
- **Text Primary:** `#FFFFFF` (High emphasis: Headlines, primary body text)
- **Text Secondary:** `#AAAAAA` (Medium emphasis: Metadata, release dates, subtitles)
- **Text Muted:** `#717171` (Low emphasis: Disabled text, minor UI labels)
- **Text Inverse:** `#0F0F0F` (Used on solid bright backgrounds, e.g., on top of primary buttons)

## Semantic / Feedback Colors
Used universally across public and admin interfaces to convey state.
- **Success:** `#2E7D32` (Approved, published, success toasts)
- **Error/Destructive:** `#D32F2F` (Delete actions, form errors)
- **Warning:** `#ED6C02` (Draft status, destructive warnings)
- **Info:** `#0288D1` (Help text, tooltips)

## Usage Rules
1. **Never use Primary Red for large background areas.** It is strictly an accent and CTA color.
2. **Text contrast must pass WCAG AA.** Always verify text colors against their background surfaces.
3. **Avoid pure black (`#000000`) for surfaces.** It removes depth. Use the defined base `#0F0F0F` instead.
