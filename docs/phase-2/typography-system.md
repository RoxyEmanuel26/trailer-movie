# Typography System

## Font Family Recommendation
- **Primary Font (Inter or Roboto):** A clean, highly legible, modern sans-serif font. It performs exceptionally well across various screen sizes and weights.
- **Fallback:** `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`

## Font Scale & Hierarchy (Desktop)
Base size is `16px` (1rem).

- **Display 1 (Hero Movie Title):** `3.5rem` (56px), Font Weight: 800 (Extra Bold), Line Height: 1.1
- **H1 (Page Title):** `2.5rem` (40px), Font Weight: 700 (Bold), Line Height: 1.2
- **H2 (Section Header):** `2rem` (32px), Font Weight: 600 (Semi-Bold), Line Height: 1.3
- **H3 (Card Title):** `1.25rem` (20px), Font Weight: 600 (Semi-Bold), Line Height: 1.4
- **Body Large (Intro text):** `1.125rem` (18px), Font Weight: 400 (Regular), Line Height: 1.6
- **Body Base (Standard text):** `1rem` (16px), Font Weight: 400 (Regular), Line Height: 1.5
- **Metadata / Caption:** `0.875rem` (14px), Font Weight: 400 (Regular), Line Height: 1.4
- **Micro / Badge:** `0.75rem` (12px), Font Weight: 600 (Semi-Bold), Letter Spacing: 0.05em, Text-Transform: Uppercase

## Mobile Behavior
Headlines must scale down significantly on mobile to prevent awkward text wrapping.
- **Display 1 (Mobile):** `2.5rem` (40px)
- **H1 (Mobile):** `2rem` (32px)
- **H2 (Mobile):** `1.5rem` (24px)
- *Body sizes remain identical to desktop for readability.*

## Usage Rules
- **Line Length:** Restrict body text width (e.g., synopsis) to a maximum of `65-75 characters` (`max-w-prose`) to maintain readability.
- **Letter Spacing:** Tighter letter spacing on massive display headers; slightly looser letter spacing on uppercase micro-text.
- **Movie Titles:** Never truncate movie titles in detailed views, but it is acceptable to use ellipsis (`text-overflow: ellipsis`) on constrained grid cards to maintain layout alignment.
