import { prisma } from '../src/lib/prisma';
import { tmdbFetch } from '../src/lib/tmdb/client';
import fs from 'fs';
import path from 'path';

const STATE_FILE = path.join(process.cwd(), 'bulk-discover-state.json');

interface State {
  startDate: string;
  endDate: string;
  currentPage: number;
  totalPages: number | null;
}

// Function to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

async function main() {
  console.log('--- TrailerTube Bulk Discover & Import Tool ---');
  
  let state: State;

  // 1. Load or Initialize State
  if (fs.existsSync(STATE_FILE)) {
    console.log('Found existing state file. Resuming previous bulk import...');
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } else {
    console.log('Starting fresh bulk import from 2022 to today...');
    state = {
      startDate: '2022-01-01',
      endDate: formatDate(new Date()), // Today
      currentPage: 1,
      totalPages: null,
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  }

  console.log(`Target: Movies released between ${state.startDate} and ${state.endDate}`);
  console.log(`Starting at page: ${state.currentPage}\n`);

  try {
    while (true) {
      if (state.totalPages !== null && state.currentPage > state.totalPages) {
        console.log('\n✅ All pages have been discovered and queued!');
        console.log('You can safely delete bulk-discover-state.json now.');
        break;
      }

      console.log(`\n[Page ${state.currentPage}${state.totalPages ? `/${state.totalPages}` : ''}] Fetching from TMDB...`);
      
      // 2. Fetch page from TMDB
      const response = await tmdbFetch<any>('/discover/movie', {
        params: {
          'primary_release_date.gte': state.startDate,
          'primary_release_date.lte': state.endDate,
          'sort_by': 'primary_release_date.desc', // newest first
          page: state.currentPage,
          language: 'en-US',
        },
      });

      if (!state.totalPages) {
        state.totalPages = Math.min(response.total_pages, 500); // TMDB limits API to max 500 pages
      }

      const movies = response.results;
      console.log(`Found ${movies.length} movies on this page.`);

      let newQueued = 0;
      let skippedDuplicates = 0;

      // 3. Process each movie
      for (const movie of movies) {
        if (!movie.id) continue;

        // Check if movie already exists in our database
        const existingMovie = await prisma.movie.findUnique({
          where: { tmdbId: movie.id },
          select: { id: true }
        });

        if (existingMovie) {
          skippedDuplicates++;
          continue;
        }

        // Check if it's already queued in import_jobs
        const existingJob = await prisma.importJob.findFirst({
          where: { tmdbId: movie.id, entityType: 'Movie' },
          select: { id: true }
        });

        if (existingJob) {
          skippedDuplicates++;
          continue;
        }

        // Enqueue the new movie import job
        await prisma.importJob.create({
          data: {
            tmdbId: movie.id,
            entityType: 'Movie',
            status: 'PENDING',
          }
        });
        newQueued++;
        process.stdout.write('+'); // Visual indicator of new queue
      }

      console.log(`\nPage ${state.currentPage} summary: Queued ${newQueued} new movies. Skipped ${skippedDuplicates} duplicates.`);

      // 4. Update State and move to next page
      state.currentPage++;
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

      // Small delay to be polite to our own database and prevent CPU spikes
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } catch (error: any) {
    if (error.name === 'TmdbRateLimitError' || error.message?.includes('Rate limit') || error.response?.status === 429) {
      console.error('\n⚠️ TMDB API Rate Limit reached!');
      console.log('The program is pausing automatically.');
      console.log('Your progress has been saved securely to bulk-discover-state.json.');
      console.log('You can run this script again later or tomorrow to resume from where it left off.');
    } else {
      console.error('\n❌ An unexpected error occurred:', error.message);
      console.log('Progress is saved. You can rerun the script to try again.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Allow graceful shutdown on Ctrl+C
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Script interrupted by user.');
  console.log('Progress has been saved. Run again to resume.');
  await prisma.$disconnect();
  process.exit(0);
});

main();
