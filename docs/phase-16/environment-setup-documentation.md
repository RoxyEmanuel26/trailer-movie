# Environment Setup Documentation

## Getting Started Locally

If an engineer takes two days to set up their local environment, the project is failing at maintainability. The setup must take less than 15 minutes.

### Required Documentation Sections

1. **Prerequisites:**
   - Exact version of Node.js (recommend using `nvm` or `fnm`).
   - Package manager (e.g., `npm` vs `yarn` vs `pnpm`).
   - Docker (if used for local databases).

2. **Secrets & Environment Variables:**
   - Explicit instructions on where to find the local development API keys (e.g., "Ask the Tech Lead to invite you to the 1Password Developer vault").
   - Explanation of the `.env.example` file.

3. **Database Setup:**
   - Commands to spin up the local database (e.g., `docker-compose up -d db`).
   - Commands to run migrations (e.g., `npm run db:push`).
   - Commands to seed the database with test data (e.g., `npm run db:seed`).

4. **Booting the App:**
   - The command to start the frontend and backend servers (e.g., `npm run dev`).

5. **Verification:**
   - A checklist to prove the setup worked. (e.g., "Open `localhost:3000`. You should see the homepage. Log in to `localhost:3000/admin` using `admin@test.com / password123`. If this works, you are done.")
