# Hosting and Runtime Model

## Where the Application Lives

The hosting architecture prioritizes managed services (PaaS/Serverless) to minimize operational overhead while maximizing developer velocity.

### Web Application & API Hosting Model (Serverless / Edge)
- **Approach:** Deploy the frontend and API routes using a managed Serverless or Edge platform (e.g., Vercel, AWS Amplify, Cloudflare Pages/Workers).
- **Why:** 
  - **Simplicity:** Zero server maintenance, OS patching, or load balancer configuration.
  - **Scalability:** Automatically scales from 0 to 10,000 requests per second without intervention.
  - **Cost:** Pay-per-compute model is extremely cost-effective for traffic that spikes (e.g., when a highly anticipated trailer drops).

### Admin Panel Hosting Model
- If the admin panel is part of the same monolithic codebase (e.g., Next.js), it runs on the same serverless infrastructure, protected by middleware authentication.
- If it is a separate SPA (Single Page Application), it is hosted as static assets on a CDN, communicating with the API.

### Static Asset Hosting Model
- **HTML/CSS/JS:** Served directly from the hosting provider's global CDN (e.g., Vercel Edge Network).
- **Why:** Ensures the lowest possible latency (Time to First Byte) globally.

### Worker / Background Job Hosting
- Serverless functions have execution time limits (e.g., 10-60 seconds).
- **Approach:** For long-running tasks (e.g., massive database migrations, video processing, hourly analytics aggregation), use a dedicated background worker service (e.g., AWS SQS + Lambda, Inngest, or a small persistent Docker container on AWS Fargate/Render).
