import { drainImportQueue } from '../src/lib/jobs/drain-import-queue';
import { isLocalImportMode } from '../src/lib/jobs/execution-mode';
import { classifyJobError } from '../src/lib/jobs/error-classification';
import { databaseConnectionTimeout } from '../src/lib/db-connection-settings';

const pause = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

async function checkWebsiteHealth() {
  const url = process.env.IMPORT_HEALTHCHECK_URL?.trim();
  if (!url) return { healthy: true, latency: 0 };
  const maximumLatency = Number(process.env.IMPORT_HEALTHCHECK_MAX_MS || '2500');
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'MovieFlix-Local-Import-Worker/1.0' },
      signal: AbortSignal.timeout(Math.max(1_000, maximumLatency + 1_000)),
    });
    const latency = Date.now() - startedAt;
    return { healthy: response.ok && latency <= maximumLatency, latency };
  } catch {
    return { healthy: false, latency: Date.now() - startedAt };
  }
}

async function warmSitemaps(baseUrl: string, secret: string) {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const indexUrl = `${normalizedBase}/sitemap.xml`;
  const headers = { Authorization: `Bearer ${secret}` };
  const index = await fetch(indexUrl, { headers, signal: AbortSignal.timeout(120_000) });
  if (!index.ok) throw new Error(`sitemap index returned HTTP ${index.status}`);
  const xml = await index.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => match[1].replace(/&amp;/g, '&'))
    .filter((url) => url.startsWith(`${normalizedBase}/sitemaps/`));
  const movieShards = urls.filter((url) => url.includes('/sitemaps/movies-'));
  const newestMovieShard = movieShards[movieShards.length - 1];
  // Only force-warm hot shards sequentially over the edge. Older movie shards and
  // people-* shards stay on their 6-hour disk snapshot (refreshed locally by server.js).
  const hotUrls = urls.filter(
    (url) => url.endsWith('/sitemaps/core') || (newestMovieShard && url === newestMovieShard),
  );
  for (const url of hotUrls) {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(120_000) });
    if (!response.ok) throw new Error(`sitemap shard returned HTTP ${response.status}`);
  }
}

async function main() {
  if (!isLocalImportMode() || process.env.DATABASE_DRIVER !== 'pg') {
    throw new Error('Local import requires IMPORT_EXECUTION_MODE=local and DATABASE_DRIVER=pg');
  }
  if (!process.env.TMDB_ACCESS_TOKEN) {
    throw new Error('TMDB_ACCESS_TOKEN is required for the local import worker');
  }

  const workerPool = Number(process.env.IMPORT_DB_POOL_MAX || '4');
  if (!Number.isSafeInteger(workerPool) || workerPool < 1 || workerPool > 20) {
    throw new Error('IMPORT_DB_POOL_MAX must be an integer from 1 to 20');
  }
  process.env.DB_POOL_MAX = String(workerPool);
  // The worker performs writes and can tolerate a longer pool wait than a page request.
  process.env.DB_CONNECTION_TIMEOUT_MS = String(databaseConnectionTimeout(process.env.IMPORT_DB_CONNECTION_TIMEOUT_MS, 30_000));

  const { prisma } = await import('../src/lib/prisma');
  const { ImportRepository } = await import('../src/lib/repositories/ImportRepository');
  const { importQueueWorker } = await import('../src/lib/jobs/ImportQueueWorker');
  let stopping = false;
  let changedJobs = 0;
  let changesSinceRevalidation = 0;
  let sitemapNeedsRefresh = false;
  let lastRevalidationAt = 0;
  let revalidationInFlight: Promise<void> | null = null;
  const pendingIndexPaths = new Set<string>();
  const stop = () => {
    stopping = true;
    process.stdout.write('\nStopping after the current batch. Unclaimed jobs will remain queued.\n');
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);

  process.stdout.write('Local import worker is draining movie, person, and bulk discovery queues. It will exit automatically when all current work is finished.\n');

  const requestRevalidation = async (refreshSitemaps = false) => {
    if (revalidationInFlight) await revalidationInFlight;
    if (changesSinceRevalidation === 0 && pendingIndexPaths.size === 0 && !(refreshSitemaps && sitemapNeedsRefresh)) return;
    const baseUrl = process.env.REVALIDATION_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
    const secret = process.env.REVALIDATION_SECRET;
    if (!baseUrl || !secret) return;
    const submittedChanges = changesSinceRevalidation;
    const submittedPaths = Array.from(pendingIndexPaths).slice(0, 250);
    const work = (async () => {
      try {
        const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/api/internal/revalidate`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ scope: 'catalog', paths: submittedPaths, refreshSitemaps }),
          signal: AbortSignal.timeout(refreshSitemaps ? 180_000 : 15_000),
        });
        if (!response.ok) process.stderr.write(`Catalog revalidation returned HTTP ${response.status}.\n`);
        else {
          for (const p of submittedPaths) pendingIndexPaths.delete(p);
          if (refreshSitemaps) {
            await warmSitemaps(baseUrl, secret);
            sitemapNeedsRefresh = false;
          }
          lastRevalidationAt = Date.now();
          changesSinceRevalidation = Math.max(0, changesSinceRevalidation - submittedChanges);
          process.stdout.write(
            `Homepage, catalog, feed, and sitemap caches revalidated and warmed${submittedPaths.length > 0 ? ` (${submittedPaths.length} movie URL(s) pushed to IndexNow)` : ''}.\n`,
          );
        }
      } catch (error) {
        process.stderr.write(`Catalog revalidation was deferred: ${error instanceof Error ? error.message : 'request failed'}.\n`);
      }
    })();
    revalidationInFlight = work;
    try { await work; } finally { revalidationInFlight = null; }
  };

  try {
    const version = await prisma.$queryRaw<Array<{ version: string; ssl: boolean }>>`
      SELECT current_setting('server_version') AS version, ssl
      FROM pg_stat_ssl WHERE pid = pg_backend_pid()
    `;
    if (!version[0]?.version.startsWith('17.') || (version[0].ssl !== true && process.env.ALLOW_INSECURE_POSTGRES !== 'true')) {
      throw new Error('Local import requires PostgreSQL 17 and either TLS or the explicit insecure override');
    }

    const [recoveredTimeouts, recoveredDictionaryRaces] = await Promise.all([
      ImportRepository.recoverMisclassifiedTimeouts(),
      ImportRepository.recoverMisclassifiedDictionaryRaces(),
    ]);
    if (recoveredTimeouts.count > 0) {
      process.stdout.write(`Recovered ${recoveredTimeouts.count} previously misclassified timeout job(s).\n`);
    }
    if (recoveredDictionaryRaces.count > 0) {
      process.stdout.write(`Recovered ${recoveredDictionaryRaces.count} dictionary race job(s).\n`);
    }

    const rawRefreshLimit = Number(process.env.IMPORT_RELEASED_DRAFT_REFRESH_LIMIT ?? '400');
    if (Number.isFinite(rawRefreshLimit) && rawRefreshLimit > 0) {
      const releasedRefresh = await ImportRepository.enqueueNewlyReleasedDrafts({
        limit: Math.min(2000, Math.floor(rawRefreshLimit)),
        staleHours: 72,
        lookbackDays: 365,
      });
      if (releasedRefresh.queued > 0) {
        process.stdout.write(
          `Queued ${releasedRefresh.queued} newly released DRAFT movie(s) for TMDB status/asset refresh.\n`,
        );
      }
    }

    const result = await drainImportQueue({
      processBatch: async () => {
        while (!stopping) {
          const health = await checkWebsiteHealth();
          if (health.healthy) break;
          process.stderr.write(`Website readiness is unhealthy or slow (${health.latency}ms); import paused for 15 seconds.\n`);
          await pause(15_000);
        }
        return importQueueWorker.processNextBatch();
      },
      shouldStop: () => stopping,
      onBatch: (summary) => {
        const changed = summary.completed + summary.partial + summary.skipped;
        changedJobs += changed;
        changesSinceRevalidation += changed;
        if (summary.completedMoviePaths?.length) {
          for (const movieUrlPath of summary.completedMoviePaths) {
            if (pendingIndexPaths.size < 2000) pendingIndexPaths.add(movieUrlPath);
          }
        }
        if (changed > 0) sitemapNeedsRefresh = true;
        if (summary.claimed > 0 || summary.discoveryProcessed || summary.failed > 0 || summary.partial > 0) {
          process.stdout.write(
            `Claimed ${summary.claimed}; completed ${summary.completed}; skipped ${summary.skipped}; partial ${summary.partial}; failed ${summary.failed}; ready ${summary.readyRemaining}; remaining ${summary.remaining}; discovery ${summary.discoveryRemaining} batch(es)\n`,
          );
        }
        if (
          changesSinceRevalidation >= 50 ||
          (changesSinceRevalidation > 0 && Date.now() - lastRevalidationAt >= 60_000)
        ) {
          void requestRevalidation();
        }
      },
      onProcessError: (error, consecutiveFailures) => {
        const classified = classifyJobError(error);
        if (!classified.retryable) return false;
        process.stderr.write(
          `Transient worker error [${classified.code}] (${consecutiveFailures} consecutive); retrying without losing queued jobs: ${classified.message}\n`,
        );
        return true;
      },
    });
    const { ImportBatchService } = await import('../src/lib/services/ImportBatchService');
    await ImportBatchService.finalizeImporting().catch(() => undefined);
    if (changedJobs > 0) {
      await requestRevalidation(true);
      if (!(process.env.REVALIDATION_BASE_URL || process.env.NEXT_PUBLIC_APP_URL) || !process.env.REVALIDATION_SECRET) {
        process.stdout.write('Catalog changed; cache fallback will refresh it within five minutes.\n');
      }
    }
    const { AnalyticsRepository } = await import('../src/lib/repositories/AnalyticsRepository');
    const cleanup = await AnalyticsRepository.deleteExpiredRawEvents(90);
    if (cleanup.count > 0) process.stdout.write(`Removed ${cleanup.count} anonymous analytics event(s) older than 90 days.\n`);
    process.stdout.write(result.reason === 'drained' ? 'Eligible import queue drained.\n' : 'Import worker stopped safely.\n');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Local import failed');
  process.exitCode = 1;
});
