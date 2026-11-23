import { prisma } from '../src/lib/prisma';
import { SeoGrowthService } from '../src/lib/services/SeoGrowthService';

async function main() {
  const apply = process.argv.includes('--apply');
  const dryRun = !apply;

  const summary = await SeoGrowthService.runDailyMaintenance({
    dryRun,
    submitIndexNow: apply,
    db: prisma,
  });

  console.log(
    `[SEO Maintenance] Mode: ${summary.mode.toUpperCase()} | Executed: ${summary.executedAt}`,
  );
  console.log(
    `  - Upcoming drafts scanned: ${summary.upcoming.scannedDrafts} | Qualifying: ${summary.upcoming.qualifyingCount} | Promoted: ${summary.upcoming.promotedCount}`,
  );
  if (summary.upcoming.topTitles.length > 0) {
    for (const item of summary.upcoming.topTitles.slice(0, 10)) {
      console.log(`      * ${item.title} (${item.releaseDate || 'TBA'}) -> /watch/${item.slug}`);
    }
  }
  console.log(
    `  - Franchises qualifying: ${summary.franchises.qualifyingCount} | Needing activation/cover: ${summary.franchises.topTitles.length} | Updated: ${summary.franchises.updatedCount}`,
  );
  if (summary.franchises.topTitles.length > 0) {
    for (const item of summary.franchises.topTitles.slice(0, 10)) {
      console.log(`      * ${item.title} (${item.movieCount} films) -> /collection/${item.slug}`);
    }
  }
  if (!dryRun) {
    console.log(
      `  - IndexNow submitted: ${summary.indexNow.submitted} (ok=${summary.indexNow.ok})`,
    );
  } else {
    console.log('[SEO Maintenance] Pass --apply to persist promotions, activate franchises, and ping IndexNow.');
  }
}

main()
  .catch((error) => {
    console.error('[SEO Maintenance] Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
