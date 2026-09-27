import type { ImportWorkerSummary } from './ImportQueueWorker';

type DrainOptions = {
  processBatch: () => Promise<ImportWorkerSummary>;
  shouldStop: () => boolean;
  onBatch: (summary: ImportWorkerSummary) => void;
  pause?: (milliseconds: number) => Promise<void>;
  stayAlive?: boolean;
  idlePollMilliseconds?: number;
};

const defaultPause = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export async function drainImportQueue({
  processBatch,
  shouldStop,
  onBatch,
  pause = defaultPause,
  stayAlive = false,
  idlePollMilliseconds = 5_000,
}: DrainOptions) {
  let idleCycles = 0;
  let cycles = 0;

  while (!shouldStop()) {
    const summary = await processBatch();
    cycles++;
    onBatch(summary);

    const discoveryIsActive = summary.discoveryRemaining > 0;
    const noReadyWork = !summary.busy && summary.readyRemaining === 0 && !summary.discoveryProcessed && !discoveryIsActive;
    if (noReadyWork) {
      if (!stayAlive) return { cycles, reason: 'drained' as const, summary };
      idleCycles = 0;
      await pause(idlePollMilliseconds);
      continue;
    }

    const readyWorkMadeNoProgress = summary.claimed === 0
      && !summary.discoveryProcessed
      && (summary.readyRemaining > 0 || summary.discoveryReady > 0);
    idleCycles = readyWorkMadeNoProgress ? idleCycles + 1 : 0;
    if (idleCycles >= 10) {
      throw new Error('Import queue made no progress after 10 attempts; pending jobs remain safe in the database');
    }
    const nextDiscoveryDelay = summary.nextDiscoveryAt
      ? Math.max(250, Math.min(5_000, summary.nextDiscoveryAt.getTime() - Date.now()))
      : 1_000;
    await pause(summary.busy ? 1_500 : summary.claimed === 0 ? nextDiscoveryDelay : 250);
  }

  return { cycles, reason: 'stopped' as const, summary: null };
}
