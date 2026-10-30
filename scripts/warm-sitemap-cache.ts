import { siteConfig } from '../src/lib/site-config';
import { SeoService } from '../src/lib/services/SeoService';
import { warmSitemapSnapshots } from '../src/lib/sitemap-cache';

async function main() {
  const { moviePageCount, personPageCount } = await warmSitemapSnapshots({
    siteUrl: siteConfig.url,
    getMoviePageCount: () => SeoService.getMovieSitemapPageCount(),
    getPersonPageCount: () => SeoService.getPersonSitemapPageCount(),
    getCoreEntries: () => SeoService.generateSitemapData(),
    getMovieEntries: (page) => SeoService.generateMovieSitemapData(page),
    getPersonEntries: (page) => SeoService.generatePersonSitemapData(page),
  });
  process.stdout.write(`Warmed sitemap index, core, ${moviePageCount} movie shard(s), and ${personPageCount} person shard(s).\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
