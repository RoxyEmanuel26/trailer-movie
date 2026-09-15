import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import fs from 'fs';
import fsp from 'fs/promises';
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
  return `'${String(val).replace(/'/g, "''")}'`;
}

// Helper to write to stream with backpressure handling
function writeChunk(stream: fs.WriteStream, chunk: string): Promise<void> {
  return new Promise((resolve) => {
    if (!stream.write(chunk)) {
      stream.once('drain', resolve);
    } else {
      resolve();
    }
  });
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

  const backupDir = path.join(process.cwd(), 'backup');
  await fsp.mkdir(backupDir, { recursive: true });

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

  const jsonFileName = `neondb_backup_${timestampStr}.json`;
  const sqlFileName = `neondb_backup_${timestampStr}.sql`;
  const jsonFilePath = path.join(backupDir, jsonFileName);
  const sqlFilePath = path.join(backupDir, sqlFileName);

  const jsonStream = fs.createWriteStream(jsonFilePath, { encoding: 'utf-8' });
  const sqlStream = fs.createWriteStream(sqlFilePath, { encoding: 'utf-8' });

  // Inisialisasi file SQL
  await writeChunk(sqlStream, `-- ====================================================\n`);
  await writeChunk(sqlStream, `-- Neon PostgreSQL Database Full Backup\n`);
  await writeChunk(sqlStream, `-- Hari & Waktu Backup: ${readableTime}\n`);
  await writeChunk(sqlStream, `-- Total Tables: ${tables.length}\n`);
  await writeChunk(sqlStream, `-- ====================================================\n\n`);
  await writeChunk(sqlStream, `SET statement_timeout = 0;\n`);
  await writeChunk(sqlStream, `SET lock_timeout = 0;\n`);
  await writeChunk(sqlStream, `SET client_encoding = 'UTF8';\n\n`);

  // Inisialisasi file JSON
  await writeChunk(jsonStream, `{\n  "metadata": {\n`);
  await writeChunk(jsonStream, `    "exportedAt": "${now.toISOString()}",\n`);
  await writeChunk(jsonStream, `    "backupTime": "${readableTime}",\n`);
  await writeChunk(jsonStream, `    "totalTables": ${tables.length}\n`);
  await writeChunk(jsonStream, `  },\n  "tables": {\n`);

  let totalRows = 0;

  // 2. Query dan streaming setiap tabel
  for (let tIdx = 0; tIdx < tables.length; tIdx++) {
    const { table_name } = tables[tIdx];
    process.stdout.write(`⏳ [${tIdx + 1}/${tables.length}] Mengunduh tabel "${table_name}"... `);

    try {
      const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "${table_name}"`);
      totalRows += rows.length;

      console.log(`✅ ${rows.length.toLocaleString()} baris`);

      // A. Stream ke file SQL
      if (rows.length > 0) {
        await writeChunk(sqlStream, `-- ----------------------------------------------------\n`);
        await writeChunk(sqlStream, `-- Table: "${table_name}" (${rows.length.toLocaleString()} rows)\n`);
        await writeChunk(sqlStream, `-- ----------------------------------------------------\n`);

        const sample = rows[0];
        const columns = Object.keys(sample);
        const quotedCols = columns.map(c => `"${c}"`).join(', ');

        for (const row of rows) {
          const values = columns.map(col => formatSqlValue(row[col])).join(', ');
          await writeChunk(sqlStream, `INSERT INTO "${table_name}" (${quotedCols}) VALUES (${values}) ON CONFLICT DO NOTHING;\n`);
        }
        await writeChunk(sqlStream, '\n');
      }

      // B. Stream ke file JSON (streaming per baris agar hemat memori)
      const isLastTable = tIdx === tables.length - 1;
      await writeChunk(jsonStream, `    "${table_name}": [\n`);
      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        const isLastRow = rIdx === rows.length - 1;
        const rowJson = JSON.stringify(rows[rIdx], replacer);
        await writeChunk(jsonStream, `      ${rowJson}${isLastRow ? '' : ','}\n`);
      }
      await writeChunk(jsonStream, `    ]${isLastTable ? '' : ','}\n`);

    } catch (err: any) {
      console.log(`❌ Gagal: ${err.message}`);
    }
  }

  // Tutup file JSON
  await writeChunk(jsonStream, `  }\n}\n`);

  // Finalisasi streams
  await new Promise(resolve => sqlStream.end(resolve));
  await new Promise(resolve => jsonStream.end(resolve));

  console.log('\n💾 Menyalin ke file referensi terbaru (latest_full_database_backup)...');
  const latestJsonPath = path.join(backupDir, 'latest_full_database_backup.json');
  const latestSqlPath = path.join(backupDir, 'latest_full_database_backup.sql');
  await fsp.copyFile(jsonFilePath, latestJsonPath);
  await fsp.copyFile(sqlFilePath, latestSqlPath);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  // Ukuran file
  const jsonStat = await fsp.stat(jsonFilePath);
  const sqlStat = await fsp.stat(sqlFilePath);
  const jsonMb = (jsonStat.size / (1024 * 1024)).toFixed(2);
  const sqlMb = (sqlStat.size / (1024 * 1024)).toFixed(2);

  console.log('\n====================================================');
  console.log('🎉 DOWNLOAD DATABASE SUKSES 100%!');
  console.log('====================================================');
  console.log(`⏱️ Waktu eksekusi : ${durationSec} detik`);
  console.log(`📊 Total tabel   : ${tables.length} tabel`);
  console.log(`📈 Total baris   : ${totalRows.toLocaleString()} baris data`);
  console.log(`📁 File JSON     : ${jsonFilePath} (${jsonMb} MB)`);
  console.log(`📁 File SQL      : ${sqlFilePath} (${sqlMb} MB)`);
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
