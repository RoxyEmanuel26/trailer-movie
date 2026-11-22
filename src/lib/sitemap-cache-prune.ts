import { readdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { SITEMAP_SNAPSHOT_VERSION } from './sitemap-cache';

const DEFAULT_CACHE_DIR = path.join(process.cwd(), '.cache', 'sitemaps');

function resolveSitemapCacheDir() {
  return process.env.SITEMAP_CACHE_DIR?.trim() || DEFAULT_CACHE_DIR;
}

export async function pruneStaleSitemapSnapshots(
  targetDir = resolveSitemapCacheDir(),
  staleTmpMaxAgeMs = 30 * 60_000,
): Promise<{ removedFiles: number; reclaimedBytes: number }> {
  let removedFiles = 0;
  let reclaimedBytes = 0;
  const activePrefix = `${SITEMAP_SNAPSHOT_VERSION}-`;
  const cutoffMs = Date.now() - staleTmpMaxAgeMs;

  const tryRemove = async (filePath: string) => {
    try {
      const info = await stat(filePath);
      if (!info.isFile()) return;
      await unlink(filePath);
      removedFiles += 1;
      reclaimedBytes += info.size;
    } catch {
      // Ignore concurrent deletes or missing paths
    }
  };

  try {
    const entries = await readdir(targetDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(targetDir, entry.name);
      if (entry.isFile()) {
        if (entry.name.endsWith('.xml') && !entry.name.startsWith(activePrefix)) {
          await tryRemove(fullPath);
        } else if (entry.name.endsWith('.tmp')) {
          try {
            const info = await stat(fullPath);
            if (info.mtimeMs < cutoffMs) {
              await tryRemove(fullPath);
            }
          } catch {}
        }
      }
    }
  } catch {
    // Directory may not exist yet
  }

  // Also prune orphaned .tmp files inside public-data snapshots
  const publicDataDir = path.join(targetDir, 'public-data');
  try {
    const entries = await readdir(publicDataDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.tmp')) {
        const fullPath = path.join(publicDataDir, entry.name);
        try {
          const info = await stat(fullPath);
          if (info.mtimeMs < cutoffMs) {
            await tryRemove(fullPath);
          }
        } catch {}
      }
    }
  } catch {}

  return { removedFiles, reclaimedBytes };
}
