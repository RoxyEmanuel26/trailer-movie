# Build Order Strategy

## The Exact Sequence

The conceptual build sequence enforces the "produce before consume" philosophy.

1. **Deployment Scaffolding (First):** Without CI/CD, we cannot test integrations. This is the absolute first step.
2. **Project Skeleton & Design Primitives:** Initialize Next.js, configure Tailwind/CSS variables, and establish the component library structure.
3. **Database Foundation:** Write the ORM schema (`schema.prisma`) and execute the initial migration to the staging database.
4. **Auth Gates:** Implement the identity provider (e.g., NextAuth/Auth0) and middleware to protect routes.
5. **API Abstractions:** Write the data access layer (queries and mutations) that interact with the database.
6. **Admin Shell:** Build the layout, navigation, and protected pages for the CMS.
7. **Public Templates:** Build the public-facing React components that consume the API.
8. **SEO Primitives:** Inject programmatic metadata generation into the public templates.
9. **Monitoring and Logging (Last):** Hook up Datadog/Sentry once the application structure is finalized, to avoid logging noisy development errors.

### Rationale
Building the Admin Shell (Step 6) before the Public Templates (Step 7) ensures that we have a UI to easily populate realistic test data into the database, making the development of the public site much smoother and more accurate.
