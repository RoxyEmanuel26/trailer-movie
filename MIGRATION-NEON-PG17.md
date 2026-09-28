# Neon PostgreSQL 18 → Pterodactyl PostgreSQL 17

> Historical migration record. The current deployment architecture is the Pterodactyl Node egg plus a separate Cloudflare Tunnel described in `PRODUCTION-PTERODACTYL.md`; Cloudflare Pages and the import Cron Worker are no longer deployment targets.

This records the local migration and remaining production cutover. Do not paste database credentials into chat, Git, CI logs, or command history.

## Current state — 2026-09-22

- The user explicitly requested a temporary non-TLS migration. The destination runs PostgreSQL 17.10 with TLS **disabled**. `ALLOW_INSECURE_POSTGRES=true` is an explicit temporary override; credentials and data can be intercepted in transit.
- A PostgreSQL 18 custom dump is in the ignored `backup/` directory as `neon-pg18-20260921T213512Z.dump` (102,916,768 bytes). The ignored `.env` rollback copy is `backup/.env.pre-pterodactyl-20260922T115445Z`. Neon remains unchanged.
- The `movieflix` database was restored from that dump. The final audit matched 44 tables, 816,997 rows, all index names, `pg_trgm`/`plpgsql`, and foreign-key validity. Prisma reports all seven migrations applied and no schema diff. The verified rehearsal database was removed, freeing 421 MB.
- The local `.env` uses separate `movieflix_app` and `movieflix_owner` roles with generated passwords that are not in this document or Git. Prisma read/write smoke tests, local production build, and local public HTTP checks passed.
- Cloudflare Pages was intentionally abandoned as the runtime target. Production will use the Pterodactyl Node egg, and imports remain on the trusted local PC.
- The historical migration chain cannot be replayed on an empty database: `20260901203840_add_ai_enrichment_fields` references `keywords`, which earlier migrations do not create. Full-dump restore succeeded. Do not run `prisma migrate reset` on `movieflix`.

## 1. Security and access gate

Ask the provider to rotate the published/default `pterodactyl` password, provide a trusted TLS certificate matching the hostname, and restrict public network access. The database and separate roles exist, but the default superuser credential remains active and exposed until the provider rotates it. `pg_trgm` is installed.

The secure end state is `sslmode=verify-full` on both URLs with `ALLOW_INSECURE_POSTGRES=false`. The temporary override uses `sslmode=disable` and `ALLOW_INSECURE_POSTGRES=true`. `pnpm db:verify-target` is read-only and prints version, TLS state, role, database, and `pg_trgm` availability, not credentials. Direct PostgreSQL from Pages still needs a successful preview test with Node.js compatibility and outbound TCP.

The local application now uses `DATABASE_DRIVER=pg`, `IMPORT_EXECUTION_MODE=local`, `DB_POOL_MAX=4`, and a separate `IMPORT_DB_POOL_MAX=6` for the manual worker. Pages should start with `DB_POOL_MAX=2`. Cloudflare must not receive `TMDB_ACCESS_TOKEN`; the local worker needs it.

## 2. Rehearsal on an isolated PostgreSQL 17 database

Use PostgreSQL **18** client tools for any future Neon backup. Do not overwrite an existing backup file. Example commands (all variables are supplied securely in the operator's shell):

```sh
pg_dump --version
pg_dump --format=custom --no-owner --no-acl --file=movieflix-neon-full.dump "$SOURCE_DATABASE_URL"
```

This is a **downgrade** from 18 to 17. PostgreSQL does not guarantee newer-version dumps restore into older major versions. Here the full custom dump restored successfully into an empty PG17 database using `pg_restore --single-transaction --exit-on-error --no-owner --no-acl`; it included the existing `_prisma_migrations` history. Running the repository's historical migrations from scratch instead failed at `keywords`. Rehearse any future restore on a separate database, and run `ANALYZE` after it succeeds.

Compare row counts for **every** application table on source and target, including join tables, using catalog-generated `SELECT count(*)` statements; also compare foreign-key validation, sequences versus maximum IDs, `pg_trgm`, schema/index definitions, and `prisma migrate status`. Reject any restore with warnings, failed constraints, or count mismatches. Check space usage including indexes and WAL against the 5 GB allowance. Preserve both backup files and Neon unchanged.

## 3. Production cutover (only after rehearsal passes)

Before the live cutover, pause all Neon writers: admin edits/enqueue, the old Cron Worker, and any other database-mutating task. Record the pause time, take a **final** Neon backup, and compare its data against `movieflix`. The earlier 44-table count comparison matched, but it is not a substitute for freezing writes: updated rows can diverge without changing counts. Reconcile any changed data before switching Pages. Do not restore over the verified `movieflix` database without a new backup and an explicit reconciliation plan. Pages cache may retain catalog pages for roughly one hour.

The local ignored `.env` has already been updated. With an authenticated Cloudflare session, configure the Pages encrypted `DATABASE_URL` (the `movieflix_app` URL), `DATABASE_DRIVER=pg`, `ALLOW_INSECURE_POSTGRES=true` only until TLS is available, `IMPORT_EXECUTION_MODE=local`, and `DB_POOL_MAX=2`. Do not upload the migration-owner URL or TMDB token to Pages. Enable Node.js compatibility and verify a preview before production. Remove/disable the separate five-minute Cloudflare import Cron Trigger; the Pages cron endpoint returns HTTP 409 in local mode as a safety backstop. Deploy, then smoke-test admin login, public movie/person pages, search, sitemap, enqueue, and database access without TMDB calls from Pages.

On the local computer, set the same destination application URL and local-only TMDB token, then run `pnpm import:process-local`. This command drains eligible movie/person jobs and bulk discovery, persists progress, and stops after its current batch on Ctrl+C. On resume, lease recovery handles interrupted jobs. Start with conservative throughput and watch 429s, connection count, latency, errors, disk/WAL growth; raise concurrency only after stable measurements. Do not run multiple local workers until the database capacity is proven.

Reopen writers only after the complete smoke test passes. If cutover fails **before** writers resume, revert Pages and local secrets to Neon. Once PG17 has accepted new writes, reverting only the URL would lose data: first reconcile those writes. Retain the Neon database and backups for at least seven days.

## 4. Required evidence before declaring completion

- PostgreSQL 17 verified locally; TLS remains disabled and must be fixed with the provider. Pages preview connectivity remains unverified.
- App role can read/write its intended tables; migration role can apply schema and `pg_trgm`.
- All seven migrations applied, zero schema drift, all table counts match, constraints/indexes/sequences valid.
- App smoke tests pass locally; local import has not been run to avoid split writes before production cutover. Pages must make no TMDB requests or imports.
- Cloudflare cron schedule disabled, production secrets changed, backup retained, and 5 GB capacity monitored. Current database size was about 422 MB and WAL about 400 MB after restore.

References: [PostgreSQL 18 pg_dump compatibility](https://www.postgresql.org/docs/18/app-pgdump.html), [Prisma production migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/deploying-database-changes), [Cloudflare Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/).
