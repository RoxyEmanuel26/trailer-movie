import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_CACHE_DIR = path.join(process.cwd(), '.cache', 'sitemaps');

function cacheDirectory() {
  return process.env.SITEMAP_CACHE_DIR?.trim() || DEFAULT_CACHE_DIR;
}

function cachePath(key: string) {
  if (!/^[a-z0-9-]+$/i.test(key)) throw new Error('Invalid sitemap cache key');
  return path.join(cacheDirectory(), `${key}.xml`);
}

export async function readSitemapSnapshot(key: string) {
  try {
    return await readFile(cachePath(key), 'utf8');
  } catch {
    return null;
  }
}

export async function writeSitemapSnapshot(key: string, xml: string) {
  const target = cachePath(key);
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, xml, { encoding: 'utf8', flag: 'wx' });
  await rename(temporary, target);
}

export async function generateSitemapWithFallback(key: string, generate: () => Promise<string>) {
  try {
    const xml = await generate();
    await writeSitemapSnapshot(key, xml);
    return { xml, stale: false };
  } catch (error) {
    const snapshot = await readSitemapSnapshot(key);
    if (snapshot) return { xml: snapshot, stale: true };
    throw error;
  }
}
