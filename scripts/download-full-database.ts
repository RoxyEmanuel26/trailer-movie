import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

// Helper to stringify BigInt and other special types
const replacer = (key: string, value: any) => {
  if (typeof value === 'bigint') return value.toString();
  return value;
};

// Helper to safely format SQL literal values
function formatSqlValue(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'bigint') return val.toString();
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  // String escaping: replace ' with '' and backslashes
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function downloadFullDatabase() {
  console.log('====================================================');
  console.log('🚀 Memulai Download Penuh Database Neon PostgreSQL...');
  console.log('====================================================\n');

  const startTime = Date.now();

  // 1. Ambil daftar semua tabel di schema public (cast ::text agar Prisma adapter kompatibel)
  const tables: { table_name: string }[] = await prisma.$queryRawUnsafe(`
    SELECT tablename::text AS table_name 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);

  console.log(`📋 Ditemukan ${tables.length} tabel di dalam database:\n`);

  const fullData: Record<string, any[]> = {};
  const stats: { table: string; count: number }[] = [];
  let totalRows = 0;

  const now = new Date();
  const daysIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayName = daysIndo[now.getDay()];
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  const readableTime = `${dayName}, ${dd}-${mm}-${yyyy} ${hh}:${min}:${ss}`;
  const timestampStr = `${dayName}_${dd}-${mm}-${yyyy}_pukul_${hh}.${min}.${ss}`;

  const sqlStatements: string[] = [
    `-- Neon PostgreSQL Database Full Backup`,
    `-- Hari & Waktu Backup: ${readableTime}`,
    `-- Total Tables: ${tables.length}`,
    `SET statement_timeout = 0;`,
    `SET lock_timeout = 0;`,
    `SET client_encoding = 'UTF8';`,
    `\n`
  ];

  // 2. Query setiap tabel secara berurutan
  for (const { table_name } of tables) {
    try {
      process.stdout.write(`⏳ Mengunduh tabel "${table_name}"... `);
      
      const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "${table_name}"`);
      
      fullData[table_name] = rows;
      stats.push({ table: table_name, count: rows.length });
      totalRows += rows.length;

      console.log(`✅ ${rows.length} baris`);

      // Generate SQL INSERT statements jika ada baris
      if (rows.length > 0) {
        sqlStatements.push(`-- Table: "${table_name}" (${rows.length} rows)`);
        
        const sample = rows[0];
        const columns = Object.keys(sample);
        const quotedCols = columns.map(c => `"${c}"`).join(', ');

        for (const row of rows) {
          const values = columns.map(col => formatSqlValue(row[col])).join(', ');
          sqlStatements.push(`INSERT INTO "${table_name}" (${quotedCols}) VALUES (${values}) ON CONFLICT DO NOTHING;`);
        }
        sqlStatements.push('\n');
      }
    } catch (err: any) {
      console.log(`❌ Gagal: ${err.message}`);
    }
  }

  // 3. Simpan ke direktori backup lokal
  const backupDir = path.join(process.cwd(), 'backup');
  await fs.mkdir(backupDir, { recursive: true });

  const jsonFileName = `neondb_backup_${timestampStr}.json`;
  const sqlFileName = `neondb_backup_${timestampStr}.sql`;
  
  const jsonFilePath = path.join(backupDir, jsonFileName);
  const sqlFilePath = path.join(backupDir, sqlFileName);

  const latestJsonPath = path.join(backupDir, 'latest_full_database_backup.json');
  const latestSqlPath = path.join(backupDir, 'latest_full_database_backup.sql');

  console.log('\n💾 Menyimpan data ke komputer lokal...');

  // Tulis file JSON
  const jsonContent = JSON.stringify({
    metadata: {
      exportedAt: new Date().toISOString(),
      totalTables: tables.length,
      totalRows,
      tableStats: stats
    },
    tables: fullData
  }, replacer, 2);

  await fs.writeFile(jsonFilePath, jsonContent, 'utf-8');
  await fs.writeFile(latestJsonPath, jsonContent, 'utf-8');

  // Tulis file SQL
  const sqlContent = sqlStatements.join('\n');
  await fs.writeFile(sqlFilePath, sqlContent, 'utf-8');
  await fs.writeFile(latestSqlPath, sqlContent, 'utf-8');

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n====================================================');
  console.log('🎉 DOWNLOAD DATABASE SUKSES 100%!');
  console.log('====================================================');
  console.log(`⏱️ Waktu eksekusi : ${durationSec} detik`);
  console.log(`📊 Total tabel   : ${tables.length} tabel`);
  console.log(`📈 Total baris   : ${totalRows.toLocaleString()} baris data`);
  console.log(`📁 File JSON     : ${jsonFilePath}`);
  console.log(`📁 File SQL      : ${sqlFilePath}`);
  console.log(`📁 File Terbaru  : backup/latest_full_database_backup.json & .sql`);
  console.log('====================================================\n');
}

downloadFullDatabase()
  .catch(err => {
    console.error('❌ Gagal mendownload database:', err);
  })
  .finally(() => {
    prisma.$disconnect();
  });
