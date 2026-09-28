# MovieFlix production runbook

## Launch blockers

Do not enable public indexing until all of these are true:

- Rotate the PostgreSQL password previously exposed outside the provider, `BETTER_AUTH_SECRET`, `ANALYTICS_HMAC_SECRET`, `REVALIDATION_SECRET`, and the admin password.
- The database and application are reachable only over a provider private network, TLS, or strict source-IP allowlists. A public unencrypted PostgreSQL endpoint is not production-ready.
- The application allocation cannot bypass Cloudflare. The separate cloudflared container must reach the app through a private/shared network or a provider firewall allowlist.
- Cloudflare Access protects `/admin*`, `/login*`, and `/api/admin*`; Better Auth remains the application-level check.
- CI is green for the exact `DEPLOY_COMMIT_SHA` used by Pterodactyl.

## Pterodactyl Node egg

Use Node 22.12 or newer, at least 2 vCPU, 2 GB RAM, and 5 GB application disk. Place production secrets in `/home/container/shared/.env.production.local`, never in Git. Set the startup command to:

```bash
bash deploy/pterodactyl/start-release.sh
```

Required panel environment values include `DEPLOY_COMMIT_SHA`, `REPOSITORY_URL`, and `SERVER_PORT`. The launcher fetches only the approved commit, installs from the lockfile, generates Prisma, runs `migrate deploy`, builds standalone output, and switches the `current` symlink only after success. A normal restart reuses an already prepared SHA. Roll back with `bash deploy/pterodactyl/rollback.sh`, then restart the server.

Pause the local import worker before promoting a release. This reserves database connections for migrations and build-time catalog rendering; resume it only after `/api/ready` and the public smoke tests pass.

Keep `SEO_INDEXING_ENABLED=false` for the first deployment. `SITEMAP_CACHE_DIR` must point to `/home/container/shared/sitemaps` so snapshots survive releases.

## Cloudflare

Create a separate cloudflared Pterodactyl server. Route `www.movieflix.site` to the private MovieFlix allocation. Redirect apex to `https://www.movieflix.site` with one permanent HTTPS redirect. Preview uses a separate Access-protected hostname and remains `noindex`.

Use `deploy/cloudflare/config.example.yml` only as a template and replace the internal service address with the provider's private/shared-network address. Never point it at an origin allocation that remains publicly reachable without a firewall allowlist.

Cache only immutable `/_next/static/*`, public image assets, `/opengraph-image`, `/feed.xml`, `/sitemap.xml`, and `/sitemaps/*`, respecting origin headers. Bypass `/admin*`, `/api*`, `/login*`, responses with session cookies, and preview hosts.

## Import and backup operations

The production website uses `IMPORT_EXECUTION_MODE=local`; it never drains the queue. On the trusted PC, configure `IMPORT_DB_POOL_MAX=4`, movie/person concurrency 4/8, `IMPORT_HEALTHCHECK_URL=https://www.movieflix.site/api/ready`, and run `pnpm import:process-local`. The worker pauses when readiness is unhealthy or slower than 2.5 seconds and revalidates public caches during long imports.

Install PostgreSQL 17 client tools and `age` on the backup PC. Set `DATABASE_BACKUP_URL` and `BACKUP_AGE_RECIPIENT`, then schedule daily, weekly, and monthly executions of `pnpm db:backup:production -- -Tier Daily` (and the corresponding tier). Keep 7 daily, 4 weekly, and 6 monthly copies. Monthly, set `BACKUP_AGE_IDENTITY` and a separate database URL whose name ends in `restore_test`, then run `pnpm db:restore-test -- -BackupPath <file.dump.age>`. A backup is not proven until that destructive test-database restore succeeds.

## Go-live sequence

1. Verify `/api/health`, `/api/ready`, homepage, a movie, `/feed.xml`, `/sitemap.xml`, and every referenced shard.
2. Confirm the origin allocation and database cannot be reached by unapproved sources.
3. Confirm the release launcher prewarmed sitemap index/core/movie/person snapshots and cached requests stay below five seconds.
4. Rebuild with `SEO_INDEXING_ENABLED=true`; verify canonical, robots, `X-Robots-Tag`, schema, RSS, and apex redirect.
5. Verify the Search Console Domain Property through DNS and submit only `https://www.movieflix.site/sitemap.xml`.
6. Monitor request errors, p95 latency, database connections, disk/WAL, sitemap status, crawl errors, and Core Web Vitals daily for seven days.
