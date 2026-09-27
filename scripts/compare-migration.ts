import { Pool } from 'pg';

type Inventory = {
  tables: Record<string, number>;
  indexes: string[];
  extensions: string[];
  invalidForeignKeys: string[];
};

async function inventory(pool: Pool): Promise<Inventory> {
  const tableRows = await pool.query<{ tablename: string }>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
  );
  const tables: Record<string, number> = {};
  await Promise.all(tableRows.rows.map(async ({ tablename }) => {
    const escaped = tablename.replaceAll('"', '""');
    const count = await pool.query<{ count: string }>(`SELECT count(*)::text AS count FROM public."${escaped}"`);
    tables[tablename] = Number(count.rows[0].count);
  }));

  const [indexRows, extensionRows, foreignKeyRows] = await Promise.all([
    pool.query<{ indexname: string }>("SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname"),
    pool.query<{ extname: string }>("SELECT extname FROM pg_extension ORDER BY extname"),
    pool.query<{ name: string }>("SELECT conname AS name FROM pg_constraint WHERE contype = 'f' AND NOT convalidated ORDER BY conname"),
  ]);
  return {
    tables,
    indexes: indexRows.rows.map((row) => row.indexname),
    extensions: extensionRows.rows.map((row) => row.extname),
    invalidForeignKeys: foreignKeyRows.rows.map((row) => row.name),
  };
}

async function main() {
  const sourceUrl = process.env.MIGRATION_SOURCE_URL || process.env.DIRECT_DATABASE_URL;
  const targetUrl = process.env.MIGRATION_TARGET_URL;
  if (!sourceUrl || !targetUrl) throw new Error('Set DIRECT_DATABASE_URL (or MIGRATION_SOURCE_URL) and MIGRATION_TARGET_URL');

  const source = new Pool({ connectionString: sourceUrl, max: 2, connectionTimeoutMillis: 10_000 });
  const target = new Pool({ connectionString: targetUrl, max: 2, connectionTimeoutMillis: 10_000 });
  try {
    const [a, b] = await Promise.all([inventory(source), inventory(target)]);
    const names = [...new Set([...Object.keys(a.tables), ...Object.keys(b.tables)])].sort();
    const countMismatches = names.flatMap((name) => a.tables[name] === b.tables[name]
      ? []
      : [{ table: name, source: a.tables[name] ?? null, target: b.tables[name] ?? null }]);
    const sourceIndexes = new Set(a.indexes);
    const targetIndexes = new Set(b.indexes);
    const result = {
      sourceTableCount: Object.keys(a.tables).length,
      targetTableCount: Object.keys(b.tables).length,
      sourceTotalRows: Object.values(a.tables).reduce((sum, count) => sum + count, 0),
      targetTotalRows: Object.values(b.tables).reduce((sum, count) => sum + count, 0),
      countMismatches,
      missingIndexes: a.indexes.filter((index) => !targetIndexes.has(index)),
      extraIndexes: b.indexes.filter((index) => !sourceIndexes.has(index)),
      sourceExtensions: a.extensions,
      targetExtensions: b.extensions,
      invalidForeignKeys: b.invalidForeignKeys,
    };
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    if (countMismatches.length || result.missingIndexes.length || result.extraIndexes.length ||
      a.extensions.join(',') !== b.extensions.join(',') || b.invalidForeignKeys.length) {
      process.exitCode = 2;
    }
  } finally {
    await Promise.all([source.end(), target.end()]);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Migration comparison failed');
  process.exitCode = 1;
});
