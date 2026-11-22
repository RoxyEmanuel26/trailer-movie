import { mkdir, readFile, rename, stat, unlink, utimes, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { serializeSitemap, serializeSitemapIndex, type SitemapEntry, type SitemapIndexItem } from './sitemap-xml';

const DEFAULT_CACHE_DIR = path.join(process.cwd(), '.cache', 'sitemaps');
export const SITEMAP_SNAPSHOT_VERSION = 'v5';
export const STABLE_SITEMAP_SHARD_MAX_AGE_MS = 6 * 3_600_000;
const inFlightSitemapGenerators = new Map<string, Promise<{ xml: string; stale: boolean }>>();

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
  try {
    await writeFile(temporary, xml, { encoding: 'utf8', flag: 'wx' });
    await rename(temporary, target);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
}

export async function generateSitemapWithFallback(
  key: string,
  generate: () => Promise<string>,
  maxAgeMs = 300_000,
) {
  const existing = inFlightSitemapGenerators.get(key);
  if (existing) return existing;

  const task = (async () => {
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
      // Fresh identical snapshots must not slide their expiry forward on every visit,
      // while expired identical snapshots refresh mtime so bots do not hammer PostgreSQL.
      const freshSnapshot = await readSitemapSnapshot(key, maxAgeMs);
      if (freshSnapshot !== xml) {
        const anySnapshot = freshSnapshot === null ? await readSitemapSnapshot(key, Infinity) : freshSnapshot;
        if (anySnapshot === xml) {
          const now = new Date();
          await utimes(cachePath(key), now, now);
        } else {
          await writeSitemapSnapshot(key, xml);
        }
      }
    } catch {
      // A read-only disk must not turn successfully generated XML into a 503.
      console.warn('Sitemap snapshot could not be persisted; serving generated XML.');
    }
    return { xml, stale: false };
  })().finally(() => {
    if (inFlightSitemapGenerators.get(key) === task) {
      inFlightSitemapGenerators.delete(key);
    }
  });

  inFlightSitemapGenerators.set(key, task);
  return task;
}

export interface WarmSitemapSnapshotsInput {
  siteUrl: string;
  getMoviePageCount: () => Promise<number>;
  getPersonPageCount: () => Promise<number>;
  getCoreEntries: () => Promise<SitemapEntry[]>;
  getMovieEntries: (page: number) => Promise<SitemapEntry[]>;
  getPersonEntries: (page: number) => Promise<SitemapEntry[]>;
  getMoviesLikePageCount?: () => Promise<number>;
  getMoviesLikeEntries?: (page: number) => Promise<SitemapEntry[]>;
}

export async function warmSitemapSnapshots(input: WarmSitemapSnapshotsInput) {
  const baseUrl = input.siteUrl.replace(/\/+$/, '');
  const moviePageCount = await input.getMoviePageCount();
  const personPageCount = await input.getPersonPageCount();
  const moviesLikePageCount = input.getMoviesLikePageCount ? await input.getMoviesLikePageCount() : 0;
  const coreEntries = await input.getCoreEntries();
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
  for (let page = 0; page < moviesLikePageCount; page += 1) {
    items.push({
      url: `${baseUrl}/sitemaps/movies-like-${page}`,
      ...(coreLastMod ? { lastModified: coreLastMod } : {}),
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
  if (input.getMoviesLikeEntries) {
    for (let page = 0; page < moviesLikePageCount; page += 1) {
      await writeSitemapSnapshot(
        sitemapSnapshotKey(`movies-like-${page}`),
        serializeSitemap(await input.getMoviesLikeEntries(page)),
      );
    }
  }
  for (let page = 0; page < personPageCount; page += 1) {
    await writeSitemapSnapshot(
      sitemapSnapshotKey(`people-${page}`),
      serializeSitemap(await input.getPersonEntries(page)),
    );
  }
  return input.getMoviesLikePageCount
    ? { moviePageCount, personPageCount, moviesLikePageCount }
    : { moviePageCount, personPageCount };
}
