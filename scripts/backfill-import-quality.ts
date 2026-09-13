import 'dotenv/config';
import { MovieQualityStatus, MovieStatus, TrailerSource, TrailerStatus } from '@prisma/client';
import { prisma } from '../src/lib/prisma';
import { ImportQualityService } from '../src/lib/services/ImportQualityService';

async function dryRun() {
  const candidates = await prisma.movie.count({
    where: { status: MovieStatus.PUBLISHED, deletedAt: null, importQualityStatus: MovieQualityStatus.NEEDS_REVIEW },
  });
  const affected = await prisma.movie.count({
    where: {
      status: MovieStatus.PUBLISHED,
      deletedAt: null,
      importQualityStatus: MovieQualityStatus.NEEDS_REVIEW,
      OR: [
        { posterUrl: null },
        { posterUrl: '' },
        { posterUrl: { contains: 'coming soon', mode: 'insensitive' } },
        {
          AND: [
            { OR: [{ youtubeTrailerId: null }, { youtubeTrailerId: '' }] },
            { trailers: { none: { sourceType: TrailerSource.YOUTUBE, status: TrailerStatus.ACTIVE } } },
          ],
        },
      ],
    },
  });
  console.log(JSON.stringify({ mode: 'dry-run', candidates, wouldUnpublish: affected, batchSize: 250 }, null, 2));
}

async function applyBackfill() {
  let processed = 0;
  let unpublished = 0;
  while (true) {
    const result = await ImportQualityService.refreshLegacyBatch(250);
    processed += result.processed;
    unpublished += result.unpublished;
    console.log(JSON.stringify({ processed, unpublished }));
    if (result.processed === 0 || !result.remaining) break;
  }
  console.log(JSON.stringify({ mode: 'apply', processed, unpublished }, null, 2));
}

const shouldApply = process.argv.includes('--apply');
(shouldApply ? applyBackfill() : dryRun())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
