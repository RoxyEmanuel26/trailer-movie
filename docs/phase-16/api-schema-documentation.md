# API and Schema Documentation

## The Data Contracts

Code changes constantly, but data schemas and API contracts form the rigid skeleton of the application. They must be accurately documented.

### Database Schema References
- We do **not** manually maintain a Markdown table of every database column. It will rot instantly.
- **Strategy:** The ORM schema file (e.g., `schema.prisma`) is the single source of truth. The documentation should simply link to this file and explain the *relationships* (e.g., "Why does `Movie` have a many-to-many relationship with `Person` via a `Role` table?").
- Automated tools (e.g., Prisma Studio or ERD generators) should be used to visualize the database automatically from the code.

### Internal API References
- For internal APIs (Next.js API routes), rely on TypeScript types and Zod schemas as the primary documentation.
- The documentation should explain the *patterns* (e.g., "All list endpoints accept `?limit` and `?page` and return a standard pagination object").

### Public/External API References
- If the project exposes a public API for third-party consumers, it must be documented using an industry standard like OpenAPI (Swagger).
- This specification must be generated automatically from the code (e.g., using `zod-to-openapi`) to ensure it never drifts from reality.

### Migration Notes
- When a backward-incompatible schema change is made (which should be rare), it must be documented in a dedicated `MIGRATIONS.md` file, explaining to other developers how to migrate their local databases without losing data.
