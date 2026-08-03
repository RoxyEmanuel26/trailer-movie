# Phase 2 — Design System

## Goal
You are working on **Phase 2 only** for a website trailer movie project.

Your task is to define the complete design system and visual language before building any UI screens.

Do **not** create application pages, logic, database code, or API integration yet.

The purpose of this phase is to ensure every future screen is consistent, scalable, and easy to implement.

---

## Primary Objective
Create a production-ready design system for a modern movie trailer website that feels:

- Cinematic
- Clean
- Premium
- Fast
- Mobile-friendly
- SEO-friendly
- Monetization-friendly
- Easy to extend

The design system must support both the public website and the admin panel.

---

## What You Must Define

### 1) Brand Direction
Define the visual personality of the product.

Answer:
- What should the site feel like?
- What emotions should the interface create?
- What should it avoid looking like?
- What type of movie/trailer brand identity is ideal?

### 2) Color System
Create a complete color palette with semantic meaning.

Include:
- Primary colors
- Secondary colors
- Accent colors
- Background colors
- Surface colors
- Text colors
- Border colors
- Success / warning / error / info colors
- Dark mode palette

Explain the usage rules for each color.

### 3) Typography System
Define the typographic hierarchy.

Include:
- Font family recommendation
- Headline styles
- Body text styles
- Caption styles
- Button text styles
- Movie title styles
- Metadata styles
- Admin interface typography

Explain how typography should behave on mobile and desktop.

### 4) Layout System
Define layout rules for the whole product.

Include:
- Grid structure
- Container widths
- Spacing scale
- Section spacing
- Breakpoints
- Responsive behavior
- Page density rules

### 5) Core UI Components
Define the reusable components required by the product.

Include:
- Navigation bar
- Mobile menu
- Search input
- Movie card
- Trailer card
- Genre chip
- Badge
- Button variants
- Hero section
- Footer
- Tabs
- Pagination
- Modal
- Dropdown
- Skeleton loader
- Empty state
- Toast/alert
- Filter panel
- Breadcrumb
- Admin sidebar
- Table row
- Form field

For each component, define:
- Purpose
- Variants
- States
- Spacing behavior
- Responsive behavior

### 6) Movie UI Patterns
Define the visual rules for movie-related content.

Include:
- Poster aspect ratio
- Trailer thumbnail treatment
- Rating display
- Genre display
- Release date display
- Runtime display
- Cast list treatment
- Collection grouping
- Featured movie presentation
- Trending movie presentation
- Empty poster fallback

### 7) Public Page Templates
Define the reusable page patterns for public-facing pages.

Include:
- Homepage template
- Movie detail template
- Genre listing template
- Search results template
- Trending listing template
- Upcoming listing template
- Static content page template

### 8) Admin Page Templates
Define the reusable page patterns for the admin panel.

Include:
- Dashboard template
- Listing page template
- Create/edit form template
- Detail page template
- Settings template
- Analytics template
- User management template

### 9) Interaction Rules
Define how the interface should behave.

Include:
- Hover states
- Focus states
- Active states
- Loading states
- Error states
- Disabled states
- Success states
- Animated transitions
- Motion limits

### 10) Accessibility Rules
The design system must be usable and accessible.

Define:
- Contrast expectations
- Keyboard navigation support
- Screen reader expectations
- Touch target size rules
- Motion reduction behavior
- Readability rules

### 11) Dark Mode Rules
Define how dark mode should behave.

Include:
- Background hierarchy
- Surface hierarchy
- Text hierarchy
- Shadow behavior
- Border usage
- Icon visibility
- Image treatment

### 12) SEO and Performance Awareness
The design system must not harm SEO or performance.

Define design rules that support:
- Fast rendering
- Image optimization
- Minimal layout shift
- Clear heading structure
- Readable content hierarchy
- Mobile-first layouts

### 13) Monetization Placement Guidelines
Define safe ad and monetization placement rules.

Include:
- Where ads may appear
- Where ads must not appear
- How to avoid ruining UX
- How to preserve reading and browsing flow

### 14) Admin vs Public Separation
Define visual differences between:
- Public website UI
- Admin panel UI

They must feel related but not identical.

---

## Required Deliverables
Create the following documents in Markdown.

### `/docs/phase-2/`
- `design-principles.md`
- `color-system.md`
- `typography-system.md`
- `layout-system.md`
- `component-library.md`
- `movie-ui-patterns.md`
- `public-page-templates.md`
- `admin-page-templates.md`
- `interaction-states.md`
- `accessibility-guidelines.md`
- `dark-mode-guidelines.md`
- `seo-performance-rules.md`
- `monetization-placement-guidelines.md`
- `admin-vs-public-separation.md`
- `phase-2-summary.md`
- `phase-2-decision-log.md`

---

## Required Structure for Each Document
Each document should be written clearly and professionally with:

- Clear headings
- Short but useful explanations
- Decision-oriented language
- No unnecessary fluff
- No vague recommendations without reasons
- No duplicate content across files unless needed for clarity

---

## What Each File Must Contain

### `design-principles.md`
Define the core visual and UX principles that govern the entire product.

### `color-system.md`
Define the palette, semantic meanings, and token-like usage rules.

### `typography-system.md`
Define font scale, hierarchy, and usage rules.

### `layout-system.md`
Define the spacing, grid, breakpoints, and structure rules.

### `component-library.md`
Document reusable components, variants, and states.

### `movie-ui-patterns.md`
Document how movie-related content should be displayed consistently.

### `public-page-templates.md`
Describe reusable public page layout patterns.

### `admin-page-templates.md`
Describe reusable admin interface layout patterns.

### `interaction-states.md`
Describe UI state behavior and motion rules.

### `accessibility-guidelines.md`
Document accessibility requirements and guardrails.

### `dark-mode-guidelines.md`
Define dark theme behavior and visual hierarchy.

### `seo-performance-rules.md`
Document design constraints that protect SEO and performance.

### `monetization-placement-guidelines.md`
Explain safe monetization placement rules.

### `admin-vs-public-separation.md`
Define the visual and behavioral separation between admin and public UI.

### `phase-2-summary.md`
Provide a concise summary of the design system decisions.

### `phase-2-decision-log.md`
Record final design decisions and trade-offs made in this phase.

---

## Rules

1. **Do not write implementation code**.
2. **Do not create page components yet**.
3. **Do not start API integration yet**.
4. **Do not start database work yet**.
5. **Do not produce a random aesthetic without rationale**.
6. **Every major design choice must have a reason**.
7. **Favor consistency over novelty**.
8. **Favor readability and clarity over decoration**.
9. **Keep public and admin UX related but distinct**.
10. **Design for mobile first**.

---

## Quality Bar
The output should be detailed enough that a developer or AI agent can implement the entire UI without guessing.

The design system must answer:
- What does the product look and feel like?
- How should every component behave?
- What are the visual rules?
- What must never happen?
- How do we keep the UI consistent across all future phases?

---

## Completion Criteria
Phase 2 is complete only if:
- All required Markdown files are created
- Color system is defined
- Typography system is defined
- Layout system is defined
- Core components are documented
- Public and admin UI templates are documented
- Accessibility rules are documented
- Dark mode rules are documented
- SEO/performance-safe design rules are documented
- Monetization placement rules are documented
- Final design decisions are recorded
- No implementation code has been written

---

## Output Format
When you finish, respond with:
1. A short status summary
2. The list of files created
3. Any unresolved design questions that should be answered before Phase 3

Do not begin Phase 3 until Phase 2 is fully approved.

