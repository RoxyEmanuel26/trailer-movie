import { Pool } from 'pg';

async function main() {
  const connectionString = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Set DIRECT_DATABASE_URL or DATABASE_URL in your local environment');

  const url = new URL(connectionString);
  const sslmode = url.searchParams.get('sslmode');
  const insecureOverride = process.env.ALLOW_INSECURE_POSTGRES === 'true' && sslmode === 'disable';
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || (sslmode !== 'verify-full' && !insecureOverride)) {
    throw new Error('Target verification requires sslmode=verify-full or the explicit insecure override');
  }

  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 5_000 });
  try {
    const result = await pool.query<{
      version: string;
      tls: boolean;
      database: string;
      role: string;
      can_create: boolean;
      trgm_available: boolean;
    }>(`
      SELECT current_setting('server_version') AS version,
             (SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid()) AS tls,
             current_database() AS database,
             current_user AS role,
             has_database_privilege(current_user, current_database(), 'CREATE') AS can_create,
             EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_trgm') AS trgm_available
    `);
    const target = result.rows[0];
    if (!target || !target.version.startsWith('17.') || (!target.tls && !insecureOverride)) {
      throw new Error('Target must be PostgreSQL 17 over TLS, unless the insecure override is explicitly enabled');
    }
    process.stdout.write(JSON.stringify(target, null, 2) + '\n');
    if (!target.trgm_available) throw new Error('pg_trgm is not available on the target');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Target verification failed');
  process.exitCode = 1;
});
