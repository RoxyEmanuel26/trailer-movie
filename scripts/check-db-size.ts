import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function checkDatabaseSize() {
  console.log('--- Checking Neon PostgreSQL Storage Usage ---\n');

  // 1. Total Database Size
  const dbSizeRes: any[] = await prisma.$queryRawUnsafe(`
    SELECT 
      current_database()::text AS db_name,
      pg_database_size(current_database())::bigint AS size_bytes,
      pg_size_pretty(pg_database_size(current_database()))::text AS readable_size;
  `);

  const dbInfo = dbSizeRes[0];
  const sizeBytes = Number(dbInfo.size_bytes);
  const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
  const freeTierLimitMB = 500; // Neon Free Tier limit is 0.5 GB (500 MB)
  const percentUsed = ((Number(sizeMB) / freeTierLimitMB) * 100).toFixed(1);

  console.log(`📌 Database Name:     ${dbInfo.db_name}`);
  console.log(`📦 Actual DB Size:     ${dbInfo.readable_size} (${sizeMB} MB)`);
  console.log(`🎯 Neon Free Limit:    ${freeTierLimitMB} MB (0.5 GB)`);
  console.log(`📊 Storage Terpakai:   ${percentUsed}%`);
  console.log(`🟢 Sisa Kuota Bebas:   ${(freeTierLimitMB - Number(sizeMB)).toFixed(2)} MB\n`);

  // 2. Top 15 Tables by Size (Data + Indexes)
  const tableSizes: any[] = await prisma.$queryRawUnsafe(`
    SELECT
      c.relname::text AS table_name,
      pg_size_pretty(pg_total_relation_size(c.oid))::text AS total_size,
      pg_size_pretty(pg_relation_size(c.oid))::text AS table_size,
      pg_size_pretty(pg_indexes_size(c.oid))::text AS index_size,
      pg_total_relation_size(c.oid)::bigint AS total_bytes
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY pg_total_relation_size(c.oid) DESC
    LIMIT 15;
  `);

  console.log('📋 15 Tabel Terbesar di Database Anda:');
  console.table(tableSizes.map(t => ({
    'Nama Tabel': t.table_name,
    'Total Ukuran (Data+Index)': t.total_size,
    'Ukuran Data': t.table_size,
    'Ukuran Index': t.index_size,
  })));
}

checkDatabaseSize()
  .then(() => process.exit(0))
  .catch(err => {
    conso