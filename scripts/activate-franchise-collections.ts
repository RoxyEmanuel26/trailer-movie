import { Prisma } from '@prisma/client';
import { prisma } from '../src/lib/prisma';

const MIN_PUBLISHED_MOVIES = 2;
const MIN_MAX_VOTE_COUNT = 200;

interface QualifyingFranchise {
  id: string;
  title: string;
  slug: string;
  isActive: boolean;
  coverImageUrl: string | null;
  backdropUrl: string | null;
  posterUrl: string | null;
  movieCount: number;
  maxVotes: number;
  fallbackCover: string | null;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const dryRun = !apply;

  const qualifying = await prisma.$queryRaw<QualifyingFranchise[]>(Prisma.sql`
    WITH ranked_movies AS (
      SELECT
        cm."collectionId",
        m."id" AS "movieId",
        COALESCE(m."voteCount", 0)::int AS "voteCount",
        COALESCE(m."popularity", 0) AS "popularity",
        COALESCE(m."backdropUrl", m."posterUrl") AS "artUrl",
        ROW_NUMBER() OVER (
          PARTITION BY cm."collectionId"
          ORDER BY COALESCE(m."popularity", 0) DESC, COALESCE(m."voteCount", 0) DESC, m."id" ASC
        ) AS rn
      FROM "collection_movies" cm
      JOIN "movies" m ON m."id" = cm."movieId"
      WHERE m."status" = 'PUBLISHED' AND m."deletedAt" IS NULL
    )
    SELECT
      c."id",
      c."title",
      c."slug",
      c."isActive",
      c."coverImageUrl",
      c."backdropUrl",
      c."posterUrl",
      COUNT(DISTINCT rm."movieId")::int AS "movieCount",
      MAX(rm."voteCount")::int AS "maxVotes",
      MAX(CASE WHEN rm.rn = 1 THEN rm."artUrl" END) AS "fallbackCover"
    FROM "collections" c
    JOIN ranked_movies rm ON rm."collectionId" = c."id"
    WHERE BTRIM(c."slug") <> ''
    GROUP BY c."id", c."title", c."slug", c."isActive", c."coverImageUrl", c."backdropUrl", c."posterUrl"
    HAVING COUNT(DISTINCT rm."movieId") >= ${MIN_PUBLISHED_MOVIES}
       AND MAX(rm."voteCount") >= ${MIN_MAX_VOTE_COUNT}
    ORDER BY MAX(rm."voteCount") DESC, COUNT(DISTINCT rm."movieId") DESC
  `);

  const toUpdate = qualifying.filter((item) => {
    const needsActivate = !item.isActive;
    const needsCover = !item.coverImageUrl && Boolean(item.backdropUrl || item.posterUrl || item.fallbackCover);
    return needsActivate || needsCover;
  });

  console.log(
    `[Franchise Activation] Mode: ${dryRun ? 'DRY RUN' : 'APPLY'} | Qualifying franchises: ${qualifying.length} | Needing update: ${toUpdate.length}`,
  );
  if (toUpdate.length > 0) {
    console.log('Top qualifying franchises:');
    for (const item of toUpdate.slice(0, 15)) {
      console.log(
        `  - ${item.title} (/collection/${item.slug}) — ${item.movieCount} films, maxVotes=${item.maxVotes}, wasActive=${item.isActive}`,
      );
    }
  }

  if (dryRun) {
    console.log('[Franchise Activation] Pass --apply to persist changes.');
    return;
  }

  let updatedCount = 0;
  for (const item of toUpdate) {
    const resolvedCover =
      item.coverImageUrl || item.backdropUrl || item.posterUrl || item.fallbackCover || null;
    await prisma.collection.update({
      where: { id: item.id },
      data: {
        isActive: true,
        ...(resolvedCover && !item.coverImageUrl ? { coverImageUrl: resolvedCover } : {}),
      },
    });
    updatedCount += 1;
  }

  console.log(`[Franchise Activation] Updated ${updatedCount} qualifying franchise collection(s).`);
}

main()
  .catch((error) => {
    console.error('[Franchise Activation] Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
