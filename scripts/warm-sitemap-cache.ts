import { absoluteUrl } from '../src/lib/site-config';
import { SeoService } from '../src/lib/services/SeoService';
import { serializeSitemap, serializeSitemapIndex } from '../src/lib/sitemap-xml';
import { writeSitemapSnapshot } from '../src/lib/sitemap-cache';

async function main() {
  const [moviePageCount, personPageCount] = await Promise.all([
    SeoService.getMovieSitemapPageCount(),
    SeoService.getPersonSitemapPageCount(),
  ]);
  const urls = [absoluteUrl('/sitemaps/core')];
  for (let page = 0; page < moviePageCount; page += 1) urls.push(absoluteUrl(`/sitemaps/movies-${page}`));
  for (let page = 0; page < personPageCount; page += 1) urls.push(absoluteUrl(`/sitemaps/people-${page}`));

  await writeSitemapSnapshot('sitemap-index', serializeSitemapIndex(urls));
  await writeSitemapSnapshot('core', serializeSitemap(await SeoService.generateSitemapData()));

  for (let page = 0; page < moviePageCount; page += 1) {
    await writeSitemapSnapshot(
      `movies-${page}`,
      serializeSitemap(await SeoService.generateMovieSitemapData(page)),
    );
  }
  for (let page = 0; page < personPageCount; page += 1) {
    await writeSitemapSnapshot(
      `people-${page}`,
      serializeSitemap(await SeoService.generatePersonSitemapData(page)),
    );
  }
  process.stdout.write(`Warmed sitemap index, core, ${moviePageCount} movie shard(s), and ${personPageCount} person shard(s).\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
