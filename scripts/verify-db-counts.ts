import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function verifyCounts() {
  const tables: { table_name: string }[] = await prisma.$queryRawUnsafe(`
    SELECT tablename::text AS table_name 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);

  console.log(`Checking ${tables.length} tables in public schema:`);
  let totalRows = 0;
  for (const { table_name } of tables) {
    const res: { count: string | number | bigint }[] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::text as count FROM "${table_name}";`
    );
    const count = parseInt(res[0].count.toString(), 10);
    totalRows += count;
    console.log(`  - ${table_name}: ${count.toLocaleString()} rows`);
  }
  console.log(`Total rows across all tables: ${totalRows.toLocaleString()}`);
}

verifyCounts()
  .catch((err) => {
    console.error('Error verifying counts:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
