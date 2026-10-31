import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { serializeSitemap, serializeSitemapIndex, type SitemapEntry, type SitemapIndexItem } from './sitemap-xml';

const DEFAULT_CACHE_DIR = path.join(process.cwd(), '.cache', 'sitemaps');
export const SITEMAP_SNAPSHOT_VERSION = 'v4';
export const STABLE_SITEMAP_SHARD_MAX_AGE_MS = 6 * 3_600_000;

export function sitemapSnapshotKey(id: string) {
  if (!/^[a-z0-9-]+$/i.test(id)) throw new Error('Invalid sitemap cache key');
  return `${SITEMAP_SNAPSHOT_VERSION}-${id}`;
}

function cacheDirectory() {
  return process.env.SITEMAP_CACHE_DIR?.trim() || DEFAULT_CACHE_DIR;
}

function cachePath(key: string) {
  if (!/^[a-z0-9-]+$/i.test(key)) throw new Error('Invalid sitemap cache key');
  return path.join(cacheDirectory(), `${key}.xml`);
}

export async function readSitemapSnapshot(key: string, maxAgeMs = 300_000) {
  try {
    const target = cachePath(key);
    const info = await stat(target);
    if (Date.now() - info.mtimeMs > maxAgeMs) return null;
    return await readFile(target, 'utf8');
  } catch {
    return null;
  }
}

export async function writeSitemapSnapshot(key: string, xml: string) {
  const target = cachePath(key);
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporary, xml, { encoding: 'utf8', flag: 'wx' });
  await rename(temporary, target);
}

export async function generateSitemapWithFallback(key: string, generate: () => Promise<string>) {
  let xml: string;
  try {
    xml = await generate();
  } catch (error) {
    // A removed shard is not a database outage. Never resurrect its old XML.
    if (typeof error === 'object' && error !== null && 'digest' in error &&
      typeof error.digest === 'string' && error.digest.startsWith('NEXT_HTTP_ERROR_FALLBACK;404')) throw error;
    const snapshot = await readSitemapSnapshot(key, Infinity);
    if (snapshot) return { xml: snapshot, stale: true };
    throw error;
  }
  try {
    // Reading a fresh shard must not slide its expiry forward on every visit.
    if (await readSitemapSnapshot(key) !== xml) await writeSitemapSnapshot(key, xml);
  } catch {
    // A read-only disk must not turn successfully generated XML into a 503.
    console.warn('Sitemap snapshot could not be persisted; serving generated XML.');
  }
  return { xml, stale: false };
}

export interface WarmSitemapSnapshotsInput {
  siteUrl: string;
  getMoviePageCount: () => Promise<number>;
  getPersonPageCount: () => Promise<number>;
  getCoreEntries: () => Promise<SitemapEntry[]>;
  getMovieEntries: (page: number) => Promise<SitemapEntry[]>;
  getPersonEntries: (page: number) => Promise<SitemapEntry[]>;
}

export async function warmSitemapSnapshots(input: WarmSitemapSnapshotsInput) {
  const baseUrl = input.siteUrl.replace(/\/+$/, '');
  const [moviePageCount, personPageCount, coreEntries] = await Promise.all([
    input.getMoviePageCount(),
    input.getPersonPageCount(),
    input.getCoreEntries(),
  ]);
  const coreLastMod = coreEntries[0]?.lastModified;
  const items: SitemapIndexItem[] = [
    { url: `${baseUrl}/sitemaps/core`, ...(coreLastMod ? { lastModified: coreLastMod } : {}) },
  ];
  for (let page = 0; page < moviePageCount; page += 1) {
    const isNewestMovieShard = page === moviePageCount - 1;
    items.push({
      url: `${baseUrl}/sitemaps/movies-${page}`,
      ...(isNewestMovieShard && coreLastMod ? { lastModified: coreLastMod } : {}),
    });
  }
  for (let page = 0; page < personPageCount; page += 1) {
    items.push({ url: `${baseUrl}/sitemaps/people-${page}` });
  }

  await writeSitemapSnapshot(sitemapSnapshotKey('sitemap-index'), serializeSitemapIndex(items));
  await writeSitemapSnapshot(sitemapSnapshotKey('core'), serializeSitemap(coreEntries));

  for (let page = 0; page < moviePageCount; page += 1) {
    await writeSitemapSnapshot(
      sitemapSnapshotKey(`movies-${page}`),
      serializeSitemap(await input.getMovieEntries(page)),
    );
  }
  for (let page = 0; page < personPageCount; page += 1) {
    await writeSitemapSnapshot(
      sitemapSnapshotKey(`people-${page}`),
      serializeSitemap(await input.getPersonEntries(page)),
    );
  }
  return { moviePageCount, personPageCount };
}
