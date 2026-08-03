# Phase 14 Decision Log

## Infrastructure Decisions

This document records the major strategic decisions made during Phase 14 regarding how the application will be hosted and deployed.

| Decision | Rationale | Trade-offs |
| :--- | :--- | :--- |
| **Serverless/PaaS Hosting over Kubernetes/VMs** | Minimizes DevOps overhead. The team should focus on building product features, not patching Linux servers or configuring load balancers. | Vendor lock-in risk is slightly higher. Sustained, massive base-load traffic can eventually become more expensive than raw VMs. |
| **Immutable Build Artifacts** | Building once and promoting the artifact across environments guarantees that what was tested is exactly what is deployed. | Slower initial CI run (building a full Docker image or Next.js build), compared to simply running `git pull` on a server. |
| **No "Down" Database Migrations** | Rolling back a database schema is incredibly dangerous and often causes data loss. "Rolling forward" with backward-compatible migrations is much safer for zero-downtime deploys. | Requires more discipline from developers to split complex schema changes across multiple releases. |
| **Dedicated Preview Environments** | Spinning up a full environment for every PR allows product managers and QA to test features before they hit the main branch. | Increases cloud costs (running many temporary DBs) and CI pipeline execution time. |
| **Decoupled Background Workers** | Keeping heavy tasks (like image processing) off the main web server ensures public traffic (like loading the homepage) never slows down due to internal admin work. | Adds architectural complexity; requires managing a message queue and a separate worker service. |
