import { siteConfig } from '../src/lib/site-config';
import { SeoService } from '../src/lib/services/SeoService';
import { warmSitemapSnapshots } from '../src/lib/sitemap-cache';
import { pruneStaleSitemapSnapshots } from '../src/lib/sitemap-cache-prune';

async function main() {
  const { moviePageCount, personPageCount } = await warmSitemapSnapshots({
    siteUrl: siteConfig.url,
    getMoviePageCount: () => SeoService.getMovieSitemapPageCount(),
    getPersonPageCount: () => SeoService.getPersonSitemapPageCount(),
    getCoreEntries: () => SeoService.generateSitemapData(),
    getMovieEntries: (page) => SeoService.generateMovieSitemapData(page),
    getPersonEntries: (page) => SeoService.generatePersonSitemapData(page),
  });
  const pruned = await pruneStaleSitemapSnapshots().catch(() => ({ removedFiles: 0, reclaimedBytes: 0 }));
  process.stdout.write(
    `Warmed sitemap index, core, ${moviePageCount} movie shard(s), and ${personPageCount} person shard(s)` +
      (pruned.removedFiles > 0 ? ` (pruned ${pruned.removedFiles} stale snapshot file(s)).\n` : '.\n'),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
