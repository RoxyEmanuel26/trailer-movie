# Phase 3 — Database Design

## Goal
You are working on **Phase 3 only** for a website trailer movie project.

Your task is to design the database architecture in a way that is scalable, normalized, secure, and ready for future features.

Do **not** create migrations, seeders, models, API endpoints, UI components, or implementation code yet.

The purpose of this phase is to define the exact data structure that future code will use.

---

## Primary Objective
Create a complete database design for a modern movie trailer website that supports:

- Public browsing experience
- Movie detail pages
- Trailer data
- Search and filtering
- Featured content
- Admin panel management
- SEO pages
- Analytics and logs
- Future AI features
- Monetization settings

The database must support both current MVP needs and future expansion without major refactoring.

---

## What You Must Design

### 1) Database Philosophy
Define the data architecture approach.

Answer:
- What is the source of truth for each type of data?
- Which data should be stored locally?
- Which data should be synced from external APIs?
- Which data should be cached?
- Which data should be derived?

### 2) Entity Research and Modeling
Define all core entities needed by the product.

At minimum, research and document the purpose of each of these:

- movies
- trailers
- genres
- people / cast
- studios
- collections
- countries
- languages
- homepage_sections
- featured_items
- search_logs
- admin_users
- roles
- permissions
- settings
- seo_pages
- analytics_events
- audit_logs
- media_assets
- tags
- external_sources

### 3) Relationship Design
Document how the entities relate to each other.

Include:
- One-to-one relationships
- One-to-many relationships
- Many-to-many relationships
- Optional relationships
- Polymorphic relationships if needed

Explain the reason for each relationship.

### 4) Field-Level Design
For every major table, define the important fields.

For each table, include:
- Primary key
- Foreign keys
- Required fields
- Optional fields
- Unique fields
- Timestamp fields
- Soft delete behavior if needed
- Status fields
- Slug fields
- Index candidates

### 5) Content Source Strategy
Determine how external data should be handled.

For example:
- Which fields come from a movie API source?
- Which fields are manually editable from admin?
- Which fields are generated locally?
- Which fields should be synchronized periodically?
- Which fields should never be overwritten by sync?

### 6) SEO Data Design
Design the database support needed for SEO.

Include support for:
- Custom meta titles
- Custom descriptions
- Canonical overrides
- Index/noindex settings
- Open Graph image data
- Schema structured data references
- Sitemap inclusion flags
- Slug management

### 7) Admin and Permission Data Design
Design the database structure needed for access control.

Include:
- Admin user data
- Roles
- Permissions
- Role-permission mapping
- Audit trails
- Session or token tracking if needed

### 8) Homepage and Layout Data Design
Design how homepage sections will be represented.

Include support for:
- Hero section
- Trending section
- Upcoming section
- Featured collections
- Genre blocks
- Promo blocks
- Ad slots
- Custom ordering

### 9) Analytics and Logging Design
Design what should be recorded for product insight and debugging.

Include support for:
- Search terms
- Page views
- Click tracking
- Trailer plays
- Admin changes
- Sync failures
- API errors
- Security events

### 10) Media Asset Design
Design how images and media references should be stored.

Include support for:
- Poster images
- Backdrop images
- Trailer thumbnails
- Open Graph images
- Fallback images
- Uploaded admin assets

### 11) Scalability and Performance Design
Document how the schema should support scale.

Include:
- Index strategy
- Query patterns
- Denormalization where needed
- Cache-friendly fields
- Partitioning or archival ideas if needed
- Avoiding unnecessary joins in public pages

### 12) Data Integrity and Validation
Define constraints and validation rules.

Include:
- Required constraints
- Unique constraints
- Foreign key rules
- Enum or status constraints
- Referential integrity rules
- Cleanup rules for deleted records

### 13) Future Expansion Readiness
Design the schema so it can later support:
- Recommendations
- Watchlists
- User accounts
- Ratings
- Comments
- Personalization
- AI-generated summaries
- External provider switching

Do not implement these features now, but prepare the schema for them.

---

## Required Deliverables
Create the following documents in Markdown.

### `/docs/phase-3/`
- `database-philosophy.md`
- `entity-overview.md`
- `entity-relationships.md`
- `table-design-movies.md`
- `table-design-trailers.md`
- `table-design-people.md`
- `table-design-taxonomy.md`
- `table-design-content-management.md`
- `table-design-admin-security.md`
- `table-design-seo.md`
- `table-design-analytics.md`
- `table-design-media-assets.md`
- `table-design-settings.md`
- `data-sync-strategy.md`
- `data-integrity-rules.md`
- `scalability-performance-notes.md`
- `future-expansion-notes.md`
- `phase-3-summary.md`
- `phase-3-decision-log.md`

---

## Required Structure for Each Document
Each document should be written clearly and professionally with:

- Clear headings
- Direct explanations
- Explicit field names where needed
- Decision-oriented writing
- No vague recommendations without reasons
- No implementation code
- No SQL migrations yet

---

## What Each File Must Contain

### `database-philosophy.md`
Explain the overall approach to local data, synced data, cached data, and source-of-truth decisions.

### `entity-overview.md`
List all entities and explain their purpose.

### `entity-relationships.md`
Show how entities connect to each other and why.

### `table-design-movies.md`
Define the movies table design in detail.

### `table-design-trailers.md`
Define the trailers table design in detail.

### `table-design-people.md`
Define the people/cast/crew table design in detail.

### `table-design-taxonomy.md`
Define genres, countries, languages, and tag structures.

### `table-design-content-management.md`
Define homepage sections, featured items, collections, and other content management tables.

### `table-design-admin-security.md`
Define admin users, roles, permissions, and security logs.

### `table-design-seo.md`
Define SEO-specific data structures.

### `table-design-analytics.md`
Define analytics and event logging structures.

### `table-design-media-assets.md`
Define image and media asset storage structures.

### `table-design-settings.md`
Define system settings and configurable values.

### `data-sync-strategy.md`
Explain how external API data should be synchronized and protected.

### `data-integrity-rules.md`
Explain validation, constraints, and deletion behavior.

### `scalability-performance-notes.md`
Explain indexing, query patterns, and performance strategy.

### `future-expansion-notes.md`
Explain how the schema can later support additional features.

### `phase-3-summary.md`
Provide a concise summary of all database decisions.

### `phase-3-decision-log.md`
Record all final database decisions and trade-offs.

---

## Rules

1. **Do not write SQL migration code yet**.
2. **Do not create ORM models yet**.
3. **Do not create API routes yet**.
4. **Do not build UI yet**.
5. **Do not skip relationship analysis**.
6. **Do not create tables without explaining why they exist**.
7. **Prefer normalized design first, then denormalize only where needed**.
8. **Protect manual admin edits from being overwritten by sync unless explicitly allowed**.
9. **Use clear naming conventions consistently**.
10. **Document trade-offs and not just table names**.

---

## Quality Bar
The output should be detailed enough that another engineer or AI agent can build the database layer without guessing.

The database design must answer:
- What tables exist?
- Why do they exist?
- How do they relate?
- Which data is authoritative?
- How is data protected?
- How will the schema scale?
- What future features are already anticipated?

---

## Completion Criteria
Phase 3 is complete only if:
- All required Markdown files are created
- Core entities are identified
- Relationships are explained
- Key table designs are documented
- Sync strategy is documented
- Integrity rules are documented
- Scalability notes are documented
- Future expansion notes are documented
- Final decisions are recorded
- No implementation code has been written

---

## Output Format
When you finish, respond with:
1. A short status summary
2. The list of files created
3. Any unresolved schema questions that should be answered before Phase 4

Do not begin Phase 4 until Phase 3 is fully approved.

