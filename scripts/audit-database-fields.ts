import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

type Column = {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: 'YES' | 'NO';
};

type CountRow = Record<string, bigint | number | string>;

function quoteIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

async function main() {
  const columns = await prisma.$queryRaw<Column[]>`
    SELECT
      table_name::text AS table_name,
      column_name::text AS column_name,
      data_type::text AS data_type,
      is_nullable::text AS is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `;

  const grouped = new Map<string, Column[]>();
  for (const column of columns) {
    const tableColumns = grouped.get(column.table_name) ?? [];
    tableColumns.push(column);
    grouped.set(column.table_name, tableColumns);
  }

  for (const [tableName, tableColumns] of grouped) {
    const table = quoteIdentifier(tableName);
    const projections = [
      'COUNT(*)::bigint AS "__total"',
      ...tableColumns.map((column, index) =>
        `COUNT(${quoteIdentifier(column.column_name)})::bigint AS "c${index}"`,
      ),
    ];
    const [counts] = await prisma.$queryRawUnsafe<CountRow[]>(
      `SELECT ${projections.join(', ')} FROM ${table}`,
    );
    const total = Number(counts.__total);

    console.log(`\n${tableName} (${total.toLocaleString()} rows)`);
    tableColumns.forEach((column, index) => {
      const populated = Number(counts[`c${index}`]);
      const percent = total === 0 ? 0 : (populated / total) * 100;
      console.log(
        `  ${column.column_name}: ${column.data_type} · ${populated.toLocaleString()}/${total.toLocaleString()} populated (${percent.toFixed(1)}%)`,
      );
    });
  }
}

main()
  .catch((error) => {
    console.error('Database field audit failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
