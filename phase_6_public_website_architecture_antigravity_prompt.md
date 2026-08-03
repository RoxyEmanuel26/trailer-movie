# Phase 6 — Public Website Architecture

## Goal
You are working on **Phase 6 only** for a website trailer movie project.

Your task is to define the full architecture of the public-facing website before any public pages are implemented.

Do **not** create UI code, database migrations, API routes, or implementation logic yet.

The purpose of this phase is to define the public website structure, page responsibilities, content hierarchy, routing strategy, and behavior rules.

---

## Primary Objective
Create a complete public website architecture for a modern movie trailer site that supports:

- Trailer discovery
- Movie detail browsing
- Genre exploration
- Search experience
- Trending and upcoming content
- SEO-first public pages
- Fast mobile browsing
- Monetization-safe layout
- Future AI recommendations

The public site must feel polished, simple to navigate, and optimized for both users and search engines.

---

## What You Must Design

### 1) Public Website Philosophy
Define the purpose and principles of the public-facing experience.

Answer:
- What should the public site help users do?
- What should the site feel like?
- What should it avoid?
- What is the balance between entertainment, discovery, and SEO?

### 2) Routing and Page Map
Define the route structure for the entire public website.

Include conceptual routes for:
- Home
- Movie detail
- Trailer view
- Genre listing
- Search results
- Trending list
- Upcoming list
- Top rated list
- Collection pages
- Static info pages
- Error pages

Explain why each route exists and how the URL structure should support SEO.

### 3) Homepage Architecture
Define what the homepage must contain.

Include:
- Hero section
- Featured trailers
- Trending now
- Upcoming movies
- Genre blocks
- Collection blocks
- Recently added content
- Popular searches if useful
- Monetization-safe placements

Explain the order of sections and why it matters.

### 4) Movie Detail Page Architecture
Define the content and behavior of movie detail pages.

Include:
- Title hierarchy
- Trailer embed or player area
- Poster and backdrop display
- Synopsis
- Genre tags
- Release date
- Runtime
- Rating
- Cast list
- Related movies
- SEO metadata support
- Action buttons such as favorite, share, or watch trailer

Explain what should be above the fold and what should be lower on the page.

### 5) Trailer Page Architecture
If trailer pages are separate from movie pages, define their role.

Include:
- Trailer identity
- Video source behavior
- Trailer metadata
- Fallback behavior
- Related content
- SEO support

If trailer pages are not separate, explain why and how trailer behavior is embedded in movie pages.

### 6) Genre and Category Pages
Define the structure of browsing pages by genre or category.

Include:
- Genre landing page
- Genre grid/listing page
- Sort options
- Filter options
- Pagination or infinite scroll rules
- SEO-friendly heading structure

### 7) Search Experience Architecture
Define the public search experience.

Include:
- Search input placement
- Search result page structure
- Empty state behavior
- No-result suggestions
- Search filters
- Sorting behavior
- Search hinting or autocomplete if useful

### 8) Trending / Upcoming / Top Rated Pages
Define the structure of curated list pages.

Include:
- Purpose of each page type
- Ranking logic conceptually
- Page layout pattern
- SEO treatment
- Internal linking opportunities

### 9) Collection Page Architecture
Define pages for collections or curated groups.

Include:
- Collection page purpose
- Collection hero behavior
- Collection list behavior
- Editorial description support
- SEO-friendly content blocks

### 10) Static Content Pages
Define the architecture for non-dynamic pages.

Include pages such as:
- About
- Contact
- Privacy Policy
- Terms of Service
- DMCA
- Disclaimer
- Sitemap landing page if needed

Define their role in trust and SEO.

### 11) Error and Fallback Page Design
Define the experience for edge cases.

Include:
- 404 page behavior
- 500/error page behavior
- Empty content behavior
- Missing trailer behavior
- Missing poster behavior
- Provider outage fallback behavior

### 12) Navigation Architecture
Define how users move around the site.

Include:
- Header navigation
- Mobile navigation
- Footer navigation
- Breadcrumbs
- Related content links
- Genre links
- Popular/trending links

Explain how navigation should support discovery and SEO.

### 13) Content Hierarchy and Presentation Rules
Define how public content should be prioritized visually.

Include:
- Heading hierarchy
- Metadata placement
- Card layout behavior
- Image treatment
- Synopsis length limits
- Label usage
- Content density rules

### 14) Responsive Behavior
Define how the public site should adapt across devices.

Include:
- Mobile-first layout rules
- Tablet behavior
- Desktop grid behavior
- Navigation collapse behavior
- Card density rules
- Trailer/media scaling rules

### 15) Performance and Core Web Vitals Awareness
Define rules that keep the public site fast.

Include:
- Lazy loading strategy
- Image optimization expectations
- Video loading behavior
- Layout shift prevention
- Skeleton loading behavior
- Prefetch rules if useful

### 16) SEO Architecture
Define how public pages should support search engines.

Include:
- Indexable page types
- Canonical behavior
- Sitemap participation
- Structured heading strategy
- Metadata consistency
- Internal linking strategy
- Avoiding thin or duplicate pages

### 17) Monetization-Safe Public Layout
Define how ads or sponsored placements can exist without harming UX.

Include:
- Safe ad placement zones
- Unsafe placements to avoid
- Rules for content-ad balance
- Rules for mobile ad density
- Rules for preserving Core Web Vitals

### 18) Accessibility and Usability
Define public UX accessibility expectations.

Include:
- Keyboard navigation
- Visible focus states
- Readable contrast
- Touch target sizing
- Screen-reader-friendly structure
- Motion reduction behavior

### 19) Future Feature Readiness
Prepare the public website architecture so it can later support:
- User accounts
- Watchlists
- Ratings
- Comments
- Personalized recommendations
- AI-assisted discovery
- Notification systems

Do not implement these now, but keep the architecture open for them.

---

## Required Deliverables
Create the following documents in Markdown.

### `/docs/phase-6/`
- `public-website-philosophy.md`
- `routing-page-map.md`
- `homepage-architecture.md`
- `movie-detail-architecture.md`
- `trailer-page-architecture.md`
- `genre-category-pages.md`
- `search-experience-architecture.md`
- `trending-upcoming-toprated-pages.md`
- `collection-page-architecture.md`
- `static-content-pages.md`
- `error-fallback-pages.md`
- `navigation-architecture.md`
- `content-hierarchy-rules.md`
- `responsive-behavior-rules.md`
- `performance-core-web-vitals.md`
- `seo-architecture.md`
- `monetization-safe-layout.md`
- `accessibility-usability.md`
- `future-feature-readiness.md`
- `phase-6-summary.md`
- `phase-6-decision-log.md`

---

## Required Structure for Each Document
Each document should be written clearly and professionally with:

- Clear headings
- Direct explanations
- Decision-oriented language
- No unnecessary fluff
- No vague layout suggestions without reasons
- No implementation code
- No page component code

---

## What Each File Must Contain

### `public-website-philosophy.md`
Explain the purpose, behavior, and priorities of the public site.

### `routing-page-map.md`
Define the route hierarchy and URL strategy.

### `homepage-architecture.md`
Define the structure, order, and behavior of homepage sections.

### `movie-detail-architecture.md`
Define the layout and content rules for movie detail pages.

### `trailer-page-architecture.md`
Define trailer page behavior and relationship to movie pages.

### `genre-category-pages.md`
Define browsing page structure for genres and categories.

### `search-experience-architecture.md`
Define search flow, empty states, and result presentation.

### `trending-upcoming-toprated-pages.md`
Define listing page behavior for curated public pages.

### `collection-page-architecture.md`
Define collection page structure and editorial support.

### `static-content-pages.md`
Define non-dynamic trust and policy pages.

### `error-fallback-pages.md`
Define fallback and error page behavior.

### `navigation-architecture.md`
Define all discovery and traversal navigation patterns.

### `content-hierarchy-rules.md`
Define content priority and visual hierarchy rules.

### `responsive-behavior-rules.md`
Define mobile, tablet, and desktop behavior rules.

### `performance-core-web-vitals.md`
Define performance safeguards for public pages.

### `seo-architecture.md`
Define the SEO strategy for public content pages.

### `monetization-safe-layout.md`
Define safe monetization placement rules for public UI.

### `accessibility-usability.md`
Define accessibility and usability expectations.

### `future-feature-readiness.md`
Explain how the public architecture can later support advanced features.

### `phase-6-summary.md`
Provide a concise summary of all public website decisions.

### `phase-6-decision-log.md`
Record the final public architecture choices and trade-offs.

---

## Rules

1. **Do not write implementation code yet**.
2. **Do not create components yet**.
3. **Do not create database migrations yet**.
4. **Do not create API routes yet**.
5. **Do not ignore SEO in the public architecture**.
6. **Do not overload pages with unnecessary content**.
7. **Prefer discoverability and clarity over visual clutter**.
8. **Protect performance on mobile devices**.
9. **Keep monetization safe and non-intrusive**.
10. **Document trade-offs, not just route names**.

---

## Quality Bar
The output should be detailed enough that another engineer or AI agent can implement the public website without guessing.

The public website architecture must answer:
- What pages exist?
- What is each page for?
- How do users move through the site?
- What content goes where?
- What is above the fold?
- What is optimized for SEO?
- What must never hurt usability?
- How does the public site remain extensible?

---

## Completion Criteria
Phase 6 is complete only if:
- All required Markdown files are created
- Page map is defined
- Homepage architecture is defined
- Movie detail architecture is defined
- Search and browsing architectures are defined
- Static and error pages are defined
- Navigation is defined
- Responsive and performance rules are defined
- SEO and monetization-safe rules are defined
- Final decisions are recorded
- No implementation code has been written

---

## Output Format
When you finish, respond with:
1. A short status summary
2. The list of files created
3. Any unresolved public-site questions that should be answered before Phase 7

Do not begin Phase 7 until Phase 6 is fully approved.

