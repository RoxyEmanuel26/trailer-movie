# Phase 1 — Research & Product Definition

## Goal
You are working on **Phase 1 only** for a website trailer movie project.

Your task is to research, define, and document the product before any code is written.

Do **not** create application code, UI components, database migrations, or implementation files yet.

The purpose of this phase is to produce a strong technical and product foundation so later phases can be executed with minimal rework.

---

## Primary Objective
Create a complete product and research foundation for a modern **movie trailer website** with the following long-term goals:

- Public trailer browsing experience
- Movie detail pages
- Search and category discovery
- Admin panel for content management
- SEO-first architecture
- Performance-friendly design
- Monetization-ready structure
- Future AI feature compatibility

---

## What You Must Research

### 1) Product Positioning
Define what this website is and is not.

Answer clearly:
- What is the main purpose of the site?
- Who is the target audience?
- What user problems does the site solve?
- What type of content will be displayed?
- What content will not be included?

### 2) Competitor / Reference Analysis
Study similar trailer/movie discovery websites and identify patterns.

Document:
- Common homepage sections
- Common movie detail page patterns
- Search behavior patterns
- Genre navigation patterns
- SEO patterns commonly used
- Monetization patterns commonly used
- UX patterns worth adopting
- Weaknesses or gaps commonly found in competitors

### 3) Feature Scope Definition
Separate the product into:
- MVP features
- Phase 2 features
- Phase 3+ features

Be strict about what belongs in the first release.

### 4) Content Model Research
Identify the content entities the website will need.

Examples:
- Movie
- Trailer
- Genre
- Actor
- Studio
- Collection
- Homepage section
- SEO page
- Admin user
- Settings
- Audit log

You do **not** need to design the database yet, but you must research the necessary entities and explain why they are needed.

### 5) User Flow Research
Document the likely user journeys:
- First-time visitor
- Returning visitor
- Search user
- Genre browsing user
- Admin/content manager user

For each flow, describe:
- Entry point
- Main action
- Next action
- Exit point

### 6) SEO Research
Define what the site should be optimized for.

Research and document:
- URL structure ideas
- Indexable page types
- Internal linking strategy
- Title/description strategy
- Schema opportunities
- Video-related SEO opportunities
- Canonical handling concerns

### 7) Monetization Research
Document possible monetization options and their suitability.

Examples:
- Display ads
- Sponsored placements
- Featured trailers
- Affiliate links
- Referral placements
- Premium features

You must assess which options fit a trailer movie site without harming UX.

### 8) Technical Risk Research
Identify risks early.

Examples:
- Copyright / content sourcing risk
- Data source consistency
- API rate limits
- Performance issues from heavy media
- SEO duplication risk
- Admin security risk
- Scalability risk

---

## Required Deliverables
Create the following documents in Markdown.

### `/docs/phase-1/`
- `vision.md`
- `product-scope.md`
- `competitor-analysis.md`
- `user-flows.md`
- `content-model-overview.md`
- `seo-research.md`
- `monetization-research.md`
- `risk-assessment.md`
- `phase-1-summary.md`
- `phase-1-decision-log.md`

---

## Required Structure for Each Document
Each document should be written in a clean, professional format with:

- Clear headings
- Short paragraphs
- Bullet points only when useful
- Direct and actionable language
- No filler text
- No vague statements without explanation

---

## What Each File Must Contain

### `vision.md`
Explain the product vision, mission, target users, and product boundaries.

### `product-scope.md`
List MVP features, excluded features, and future features.

### `competitor-analysis.md`
Summarize observed patterns, opportunities, and differentiators.

### `user-flows.md`
Document the key user journeys in a structured way.

### `content-model-overview.md`
Explain the key content entities and their relationships at a high level.

### `seo-research.md`
Explain SEO strategy, page types, and indexing approach.

### `monetization-research.md`
Explain the best monetization models and risks.

### `risk-assessment.md`
List major product, technical, legal, and operational risks.

### `phase-1-summary.md`
Provide a concise executive summary of all research findings.

### `phase-1-decision-log.md`
Record final decisions made during this phase and why each decision was chosen.

---

## Rules

1. **Do not write code**.
2. **Do not generate database migrations**.
3. **Do not build UI screens yet**.
4. **Do not start implementation**.
5. **Do not skip research**.
6. **Be critical and specific**.
7. **When uncertain, state assumptions explicitly**.
8. **Prefer simple, scalable decisions over overengineered ones**.
9. **Document trade-offs, not just recommendations**.
10. **End each document with open questions or next-step implications where relevant**.

---

## Quality Bar
The output should be good enough that another engineer or AI agent can continue the project without needing to reinterpret the intent.

Each document must help answer:
- What are we building?
- For whom are we building it?
- Why is this the right scope?
- What risks should we avoid?
- What decisions are already settled?

---

## Completion Criteria
Phase 1 is complete only if:
- All required Markdown files are created
- Product scope is clearly defined
- User flows are documented
- SEO direction is outlined
- Monetization direction is outlined
- Risks are identified
- Final decisions are recorded
- No implementation code has been written

---

## Output Format
When you finish, respond with:
1. A short status summary
2. The list of files created
3. Any unresolved questions that should be answered before Phase 2

Do not begin Phase 2 until Phase 1 is fully approved.

