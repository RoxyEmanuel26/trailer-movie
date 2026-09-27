import { drainImportQueue } from '../src/lib/jobs/drain-import-queue';
import { isLocalImportMode } from '../src/lib/jobs/execution-mode';

async function main() {
  if (!isLocalImportMode() || process.env.DATABASE_DRIVER !== 'pg') {
    throw new Error('Local import requires IMPORT_EXECUTION_MODE=local and DATABASE_DRIVER=pg');
  }
  if (!process.env.TMDB_ACCESS_TOKEN) {
    throw new Error('TMDB_ACCESS_TOKEN is required for the local import worker');
  }

  const workerPool = Number(process.env.IMPORT_DB_POOL_MAX || '6');
  if (!Number.isSafeInteger(workerPool) || workerPool < 1 || workerPool > 20) {
    throw new Error('IMPORT_DB_POOL_MAX must be an integer from 1 to 20');
  }
  process.env.DB_POOL_MAX = String(workerPool);

  const { prisma } = await import('../src/lib/prisma');
  const { ImportRepository } = await import('../src/lib/repositories/ImportRepository');
  const { importQueueWorker } = await import('../src/lib/jobs/ImportQueueWorker');
  let stopping = false;
  let changedJobs = 0;
  const stop = () => {
    stopping = true;
    process.stdout.write('\nStopping after the current batch. Unclaimed jobs will remain queued.\n');
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);

  process.stdout.write('Local import worker is draining movie, person, and bulk discovery queues. It will exit automatically when all current work is finished.\n');

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

    const result = await drainImportQueue({
      processBatch: () => importQueueWorker.processNextBatch(),
      shouldStop: () => stopping,
      onBatch: (summary) => {
        changedJobs += summary.completed + summary.partial + summary.skipped;
        if (summary.claimed > 0 || summary.discoveryProcessed || summary.failed > 0 || summary.partial > 0) {
          process.stdout.write(
            `Claimed ${summary.claimed}; completed ${summary.completed}; skipped ${summary.skipped}; partial ${summary.partial}; failed ${summary.failed}; ready ${summary.readyRemaining}; remaining ${summary.remaining}; discovery ${summary.discoveryRemaining} batch(es)\n`,
          );
        }
      },
    });
    if (changedJobs > 0) {
      const baseUrl = process.env.REVALIDATION_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
      const secret = process.env.REVALIDATION_SECRET;
      if (baseUrl && secret) {
        try {
          const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/api/internal/revalidate`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${secret}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ scope: 'catalog' }),
          });
          if (!response.ok) process.stderr.write(`Catalog revalidation returned HTTP ${response.status}.\n`);
          else process.stdout.write('Homepage and catalog caches revalidated.\n');
        } catch (error) {
          process.stderr.write(`Catalog revalidation was deferred: ${error instanceof Error ? error.message : 'request failed'}.\n`);
        }
      } else {
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
