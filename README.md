# Movie Trailer Platform

This is the canonical repository for the Movie Trailer Platform.

## Architecture First

This project is governed by strict execution rules. **Do not begin implementing features without reading the documentation.**

1.  Read `MASTER_PROJECT_EXECUTION.md` in the root directory for governance and operational rules.
2.  Read the `/docs` directory. It contains Phase 1 through Phase 20 architectural specifications. Every implementation detail must trace back to these phases.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Database & ORM:** PostgreSQL + Prisma
- **Authentication:** Better Auth
- **Styling:** Tailwind CSS
- **Package Manager:** pnpm

## Getting Started

1.  Copy `.env.example` to `.env` and fill in your local secrets.
2.  Install dependencies: `pnpm install`
3.  Initialize the database: `pnpm dlx prisma migrate dev`
4.  Run the development server: `pnpm dev`
