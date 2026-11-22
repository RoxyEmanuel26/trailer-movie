import 'dotenv/config';
import pg from 'pg';

const INDEX_STATEMENTS = [
  {
    name: 'pg_trgm extension',
    sql: `CREATE EXTENSION IF NOT EXISTS pg_trgm`,
  },
  {
    name: 'movies_title_gin_idx',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "movies_title_gin_idx" ON "public"."movies" USING GIN ("title" gin_trgm_ops)`,
  },
  {
    name: 'movies_originalTitle_gin_idx',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "movies_originalTitle_gin_idx" ON "public"."movies" USING GIN ("originalTitle" gin_trgm_ops) WHERE ("originalTitle" IS NOT NULL)`,
  },
  {
    name: 'movies_public_title_trgm_idx',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "movies_public_title_trgm_idx" ON "public"."movies" USING GIN ("title" gin_trgm_ops) WHERE ("status" = 'PUBLISHED'::"MovieStatus" AND "deletedAt" IS NULL)`,
  },
  {
    name: 'movies_public_original_title_trgm_idx',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "movies_public_original_title_trgm_idx" ON "public"."movies" USING GIN ("originalTitle" gin_trgm_ops) WHERE ("status" = 'PUBLISHED'::"MovieStatus" AND "deletedAt" IS NULL AND "originalTitle" IS NOT NULL)`,
  },
  {
    name: 'movies_public_fts_idx',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "movies_public_fts_idx" ON "public"."movies" USING GIN (to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("originalTitle", ''))) WHERE ("status" = 'PUBLISHED'::"MovieStatus" AND "deletedAt" IS NULL)`,
  },
  {
    name: 'movies_public_release_year_idx',
    sql: `CREATE INDEX IF NOT EXISTS "movies_public_release_year_idx" ON "public"."movies" USING btree ("releaseDate") INCLUDE ("updatedAt") WHERE ("status" = 'PUBLISHED'::"MovieStatus" AND "deletedAt" IS NULL AND "releaseDate" IS NOT NULL)`,
  },
  {
    name: 'people_name_trgm_idx',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "people_name_trgm_idx" ON "public"."people" USING GIN ("name" gin_trgm_ops)`,
  },
  {
    name: 'idx_people_sitemap_bio160',
    sql: `CREATE INDEX IF NOT EXISTS "idx_people_sitemap_bio160" ON "public"."people" USING btree ("id") WHERE ("headshotUrl" IS NOT NULL AND BTRIM("headshotUrl") <> '' AND LENGTH(BTRIM(COALESCE("biography", ''))) >= 160)`,
  },
];

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL,
    ssl: process.env.ALLOW_INSECURE_POSTGRES === 'true' ? false : undefined,
    statement_timeout: 300_000,
  });

  await client.connect();
  try {
    // Drop any leftover INVALID indexes from previously interrupted concurrent builds
    const invalidRes = await client.query<{ index_name: string }>(`
      SELECT c.relname AS index_name
      FROM pg_index i
      JOIN pg_class c ON c.oid = i.indexrelid
      WHERE (NOT i.indisvalid OR NOT i.indisready)
        AND c.relname IN ('idx_people_sitemap_eligible', 'idx_people_sitemap_bio160')
    `);
    for (const row of invalidRes.rows) {
      process.stdout.write(`[Index] Dropping invalid index ${row.index_name}... `);
      await client.query(`DROP INDEX IF EXISTS "public"."${row.index_name}"`);
      process.stdout.write('done\n');
    }

    for (const item of INDEX_STATEMENTS) {
      const started = Date.now();
      process.stdout.write(`[Index] Ensuring ${item.name}... `);
      await client.query(item.sql);
      process.stdout.write(`done (${Date.now() - started} ms)\n`);
    }
    process.stdout.write('[Index] Running VACUUM ANALYZE on movies and ANALYZE on people...\n');
    await client.query('VACUUM ANALYZE "public"."movies"');
    await client.query('ANALYZE "public"."people"');
    process.stdout.write('[Index] All search & hub indexes are valid and analyzed.\n');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('[Index] Failed to ensure search indexes:', error);
  process.exit(1);
});
