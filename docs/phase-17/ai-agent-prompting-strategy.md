# AI Agent Prompting Strategy

## Commanding the AI

If this architecture is handed to an AI coding assistant (like Cursor or an autonomous agent) for implementation, the prompts must be highly controlled to prevent the AI from hallucinating a different architecture.

### 1. One Scope Per Prompt
- **Bad Prompt:** "Build the movie database and the admin panel to manage it." (The AI will lose context, hallucinate the schema, and write terrible UI).
- **Good Prompt:** "Based on Phase 2 (Data Architecture), implement the Prisma schema for the `Movie` and `Genre` models. Do not build the API or UI. Run `prisma format` and await my review."

### 2. Required Context
Every prompt to an AI agent must include:
- The specific Phase document it should reference.
- The specific file paths it is allowed to modify.
- The overarching rules (e.g., "Use Tailwind CSS, do not write custom CSS").

### 3. Explicit "Do Not" Commands
AI agents often try to be *too* helpful by refactoring things they shouldn't.
- Always include boundaries: "Do not touch the Authentication middleware. Do not add any new npm packages without asking first."

### 4. The Pause Trigger
- Instruct the AI to pause and wait for human review at integration checkpoints.
- Example: "Write the API endpoint. Then STOP. Do not write the frontend component until I have reviewed the API logic."
