# Ownership and Review Strategy

## Gatekeepers of Quality

Code review cannot simply be a rubber stamp. Reviewers must look for specific architectural alignment based on their domain expertise.

### 1. Architecture Alignment (The Tech Lead)
- **Focus:** Does this PR violate the core constraints? (e.g., Did the developer bypass the ORM and write a raw SQL injection vulnerability? Did they introduce a massive new npm dependency for a trivial feature?)

### 2. UI/UX Consistency (The Design Lead)
- **Focus:** Did the developer use the established Tailwind utility classes, or did they write custom CSS? Does the mobile view break on smaller screens?

### 3. API & Data Model (The Backend Lead)
- **Focus:** Is this new endpoint RESTful? Is the database query optimized, or will it cause an N+1 fetching problem when the table has 10,000 rows?

### 4. SEO & Performance (The Growth Lead)
- **Focus:** Did this PR accidentally add a `noindex` tag to the homepage? Is this new hero image using the optimized WebP format, or did they upload a 5MB uncompressed PNG?

### 5. Security (The DevSecOps Lead)
- **Focus:** Are we logging user passwords to the terminal? Is the rate-limiter properly applied to this new public form?

### Review Policy
A PR does not necessarily need approval from all 5 leads, but the Tech Lead must route the PR to the relevant specialist if a specific domain is heavily modified.
