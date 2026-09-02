import { prisma } from '../src/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

// Helper to stringify BigInt
const replacer = (key: string, value: any) =>
  typeof value === 'bigint' ? value.toString() : value;

async function exportDb() {
  console.log('Fetching all movies and relations...');
  
  const movies = await prisma.movie.findMany({
    include: {
      keywords: { include: { keyword: true } },
      countries: { include: { country: true } },
      languages: { include: { language: true } },
      companies: { include: { company: true } },
      people: { include: { person: true } },
      genres: { include: { genre: true } },
      collections: { include: { collection: true } }
    }
  });

  console.log(`Found ${movies.length} movies. Writing to backup/movies_export.json...`);
  
  const backupDir = path.join(process.cwd(), 'backup');
  await fs.mkdir(backupDir, { recursive: true });
  
  const filePath = path.join(backupDir, 'movies_export.json');
  await fs.writeFile(filePath, JSON.stringify(movies, replacer, 2), 'utf-8');
  
  console.log('Backup complete: ' + filePath);
}

exportDb().catch(console.error).finally(() => prisma.$disconnect());
