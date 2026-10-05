# MovieFlix on NuraHost Pterodactyl + Cloudflare

This runbook uses infrastructure checks supplied by the operator on 5 October 2026. Final smoke tests on the named domain are still required. Keep `SEO_INDEXING_ENABLED=false` until the go-live gates pass.

## Evidence and remaining exposure

- Node egg: Node 22.23, Bash, Git, Corepack, and editable startup. The app allocation is `SERVER_PORT=5075`; the app binds `0.0.0.0:5075`.
- `nano-1.nura.host:5075` is publicly reachable without Cloudflare. A Tunnel does **not** close it.
- A separate cloudflared egg reached the app over Docker DNS `c0fd6845-2f74-4bed-a7bd-8a6c3265127a:5075`; Quick Tunnel, QUIC/HTTP2, and restarts worked. Named Tunnel and the production hostname still require testing.
- From the app container, PostgreSQL 17.10 answered real queries at `461b710f-642a-4ea8-af0a-668edcfa5d6a.pterodactyl_nw:5112`. The public DB endpoint is `nano-1.nura.host:5112`. PostgreSQL TLS is unavailable. The operator accepts this transport risk for now.
- Docker DNS names are not numeric private IPs, but provider remapping may change them. Recheck after any server replacement or network move.

## Release and secrets

Set the Node egg startup to `bash deploy/pterodactyl/start-release.sh`. Panel variables: `DEPLOY_COMMIT_SHA` (exact green-CI commit), `REPOSITORY_URL`, `SERVER_PORT=5075`. The launcher fetches that SHA, installs from the lockfile, runs Prisma generation/migrations, builds, warms sitemap snapshots, and atomically promotes the release. A restart reuses the release; `bash deploy/pterodactyl/rollback.sh` restores the previous one. Pause the PC import worker during migration/build and resume only after readiness checks.

Place real values only in `/home/container/shared/.env.production.local`, using [the template](deploy/pterodactyl/.env.production.local.example). Never put the real file, PostgreSQL password, Tunnel credentials JSON, or origin token in Git, screenshots, logs, or chat. Rotate the previously exposed PostgreSQL password, admin password, `BETTER_AUTH_SECRET`, `ANALYTICS_HMAC_SECRET`, and `REVALIDATION_SECRET`. Use a different random `ORIGIN_GATE_SECRET` of at least 32 characters. The production build fails without it. Persist sitemap snapshots at `/home/container/shared/sitemaps`.

## Database strategy

Website and migrations use the tested internal PostgreSQL Docker DNS in the template, with `DATABASE_DRIVER=pg`, `sslmode=disable`, `ALLOW_INSECURE_POSTGRES=true`, and `DB_POOL_MAX=4`. Use separate app/migration roles where permissions allow; never enable `trust` in `pg_hba.conf`. The PC import/backup worker uses stable provider hostname `nano-1.nura.host:5112` because Docker DNS is container-local. Set `IMPORT_DB_POOL_MAX=4`; begin with movie/person concurrency 4/8 and lower it if the database slows or TMDB rate-limits. `IMPORT_EXECUTION_MODE=local` keeps import execution off the website.

The template's DB usernames are placeholders; the operator has not yet proved separate app/migration roles exist. If NuraHost exposes only the existing database account, use its rotated credentials in both URLs temporarily. If internal Docker DNS changes after a provider remap, pause release/import, test the new internal name, and update the secret environment. The stable provider hostname is a manual emergency fallback after explicit connection checks, not an automatic failover or a private path. Monitor `/api/ready` externally for immediate alerts on DNS/DB failure.

Keep the private-network `pg_hba.conf` rule for the Pterodactyl containers and password authentication (`md5` in the operator's working test); do not replace it with `trust`. The internal connection succeeded after this rule was added, but provider network remapping must trigger a fresh connection check.

Unencrypted connections on the Docker network and especially from the PC to the public DB remain an **accepted confidentiality risk**, not equivalent to TLS. Rotate credentials, limit roles, request an IP allowlist from NuraHost if available, and monitor connections and disk/WAL. Move to verified TLS or a private PC route when supported.

## Named Tunnel and direct-origin mitigation

Use a separate cloudflared server and named Tunnel. The [locally-managed ingress template](deploy/cloudflare/config.example.yml) targets the tested **internal Docker DNS** and port 5075, never the public allocation. Provision in Cloudflare, or on a trusted PC run `cloudflared tunnel login`, `cloudflared tunnel create movieflix`, and `cloudflared tunnel route dns <UUID> www.movieflix.site`. Transfer only the Tunnel-specific credentials JSON to `/home/container/.cloudflared/<UUID>.json` in the cloudflared egg; do not transfer account-wide `cert.pem`. Set startup to `cloudflared tunnel --config /home/container/.cloudflared/config.yml run <UUID>`. Validate with `cloudflared tunnel ingress validate` and `cloudflared tunnel ingress rule https://www.movieflix.site/`. A remotely-managed Tunnel is also valid, but then configure the same internal service URL in the Cloudflare dashboard and do not use the local YAML.

Create a Cloudflare **Request Header Transform Rule** for `http.host eq "www.movieflix.site"`: Set static `x-movieflix-origin-token` to the exact `ORIGIN_GATE_SECRET`. It must overwrite any incoming client value. Do this before opening the hostname. The Next.js Proxy checks the token on every route, including assets and APIs, before rendering; failure returns `403` and `no-store`. Test public `www` (`200`), direct `nano-1.nura.host:5075` with forged `Host: www.movieflix.site` and no token (`403`), wrong token (`403`), and CSS/JS through `www` (`200`). Host, `X-Forwarded-Host`, and `CF-Connecting-IP` alone are not origin authentication.

If a preview hostname points at the same app, extend the Transform Rule to that hostname (or add an equivalent rule); otherwise Proxy will correctly return `403`. Do not put the token in the browser or a URL. Test Cloudflare's rule delivery end-to-end before enabling indexing.

This token is application-layer mitigation only. The public allocation still accepts TCP traffic and can be targeted for denial of service; a leaked token restores HTTP bypass. Prefer provider firewall/private allocation or source allowlist whenever available. Cloudflare WAF and Access cannot protect direct-origin requests. Protect `/admin*`, `/login*`, and `/api/admin*` with Cloudflare Access in addition to Better Auth. Forwarded-IP-based rate limits are spoofable on the direct path and do not replace the token or firewall.

Redirect apex to canonical `https://www.movieflix.site` at Cloudflare in one permanent HTTPS hop. Preview uses a separate Access-protected hostname with `noindex`. Cache immutable assets and cacheable OG/RSS/sitemap responses according to origin headers; bypass `/admin*`, `/api*`, `/login*`, session-cookie responses, and preview.

## Backup and import

Use `pnpm import:process-local` on the PC; its `.env` uses the public provider DB hostname, not Docker DNS. Set `REVALIDATION_BASE_URL=https://www.movieflix.site`, or delay the worker until the named domain/origin rule work. The worker checks `/api/ready`, pauses on poor health, and revalidates caches during long imports.

On the backup PC install PostgreSQL 17 client tools and `age`. Configure `DATABASE_BACKUP_URL`, `BACKUP_AGE_RECIPIENT`; schedule `pnpm db:backup:production -- -Tier Daily` and weekly/monthly variants with 7 daily, 4 weekly, 6 monthly retention. Monthly, restore into a separate `restore_test` database using `pnpm db:restore-test -- -BackupPath <file.dump.age>` and `BACKUP_AGE_IDENTITY`. A backup is not proven until restore succeeds.

## Traffic capacity and safe caching

**100,000 concurrent visitors is not a proven capacity target.** Concurrent open browsers, requests per second, and simultaneous uncached SSR requests are different workloads. A single Node egg and four PostgreSQL connections cannot be assumed to handle 100,000 origin requests at once. Never run an unbounded 100,000-client test against this production allocation.

The homepage and static hubs emit public ISR cache headers; movie/person details now generate on first visit and use one-hour ISR. `/movies` remains dynamic HTML because it reads pagination query parameters, but its database list result is cached for five minutes. Search and APIs remain uncached. Import revalidation no longer evicts the entire root layout on every batch, allowing detail-page caches to survive until their TTL. Newly imported detail pages are still generated on first request.

Cloudflare does **not** cache HTML by default. Start with a narrowly scoped Cache Rule for anonymous, public GET/HEAD pages that actually return `public`/`s-maxage` from Next.js (homepage, static hubs, and verified ISR details); respect origin cache headers and do not override `private`, `no-store`, or `Set-Cookie`. Exclude `/admin*`, `/api*`, `/login*`, `/search*`, preview, and dynamic `/movies` until separately validated. Preserve the full query string, `_rsc` parameter, `rsc`/prefetch headers, and Next.js `Vary` behavior; test HTML and client navigation independently to avoid serving RSC as HTML. Cache only 200 responses after checking status-specific behavior. Purge changed URLs at Cloudflare if freshness must be faster than the edge TTL; `revalidatePath()` alone does not purge CDN copies.

Keep `/_next/static/*` cached as immutable. Do not proxy TMDB images through the Node origin unnecessarily; image URLs already use bounded TMDB sizes. Apply Cloudflare WAF/bot rules and rate limits especially to search, analytics, auth, and API routes, but do not rely on the app's in-memory limiter as a distributed traffic shield. The direct public allocation remains a denial-of-service exposure even with the origin token.

Before a traffic campaign, test gradually on staging or a provider-approved environment: warm/cold homepage, movie detail, person detail, `/movies`, search, and analytics separately at increasing request rates. Measure Cloudflare cache-hit ratio, origin requests/sec, p95/p99 latency, 5xx, Node CPU/RAM/heap, PostgreSQL active connections/query time, and Tunnel errors. Stop on sustained 5xx, DB timeouts, or memory pressure. Only a measured workload with headroom supports a capacity claim. For a high uncached/request-heavy target, add a second app origin/load balancer and coordinated Next.js cache invalidation plus an appropriately sized database; extra Tunnel replicas alone do not add app or DB capacity.

## Go-live checklist

1. Confirm CI green for `DEPLOY_COMMIT_SHA`; rotate exposed credentials; replace every placeholder; restrict environment and Tunnel credential permissions.
2. Recheck app-to-DB query, version 17, Prisma migration status, `pg_trgm`, connection count/latency, disk/WAL; recheck Docker DNS after remapping.
3. Deploy with indexing **off**. Confirm named Tunnel, DNS, certificate, apex redirect, and header rule. Test public and direct-origin requests as above. If the header rule fails, keep the site unpublished/noindex.
4. Test `/api/health`, `/api/ready`, homepage, login/admin with Access, movie/person pages, search, `/feed.xml`, `/robots.txt`, `/sitemap.xml`, and every referenced shard. Check sitemap snapshot fallback during brief DB failure.
5. Run a small local import; check saved film in DB, website, sitemap/revalidation, and stable `/api/ready`. Verify no website request calls TMDB. Run an encrypted backup and separate restore test.
6. Inspect canonical/meta/schema, Search Console verification, contact page, robots, and `X-Robots-Tag`. Only then rebuild with `SEO_INDEXING_ENABLED=true` and recheck every public template.
7. Verify Search Console Domain Property through DNS; submit only `https://www.movieflix.site/sitemap.xml`. Monitor errors, p95 origin latency, DB connections, disk/WAL, sitemap, crawl errors, and Core Web Vitals daily for seven days.

## Evidence labels

- **PROVEN by operator tests:** Node prerequisites; allocation and public direct-origin reachability; cloudflared network/restart; private Docker DNS and actual PostgreSQL 17 query; TLS absence.
- **ACCEPTED RISK:** PostgreSQL without TLS, including public PC-to-DB traffic; publicly reachable app TCP port without firewall. The token narrows HTTP bypass but does not remove these risks.
- **UNRESOLVED until live smoke test:** Named Tunnel DNS/certificate/header delivery; token on all Next routes; Access; provider remap stability; full release/migration/rollback; backup restore; indexing and Search Console.
