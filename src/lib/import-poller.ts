type PollerOptions<T> = {
  load: (signal: AbortSignal) => Promise<T>;
  onData: (data: T) => void;
  onUnavailable: (unavailable: boolean) => void;
  isVisible?: () => boolean;
  intervalMs?: number;
  timeoutMs?: number;
};

/** One in-flight request, completion-based scheduling, and bounded error backoff. */
export function createImportPoller<T>(options: PollerOptions<T>) {
  const interval = options.intervalMs ?? 10_000;
  let stopped = false;
  let failures = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;
  let inFlight: Promise<T | null> | undefined;

  const refresh = (): Promise<T | null> => {
    if (stopped) return Promise.resolve(null);
    if (inFlight) return inFlight;
    controller = new AbortController();
    const active = controller;
    const timeout = setTimeout(() => active.abort(), options.timeoutMs ?? 20_000);
    inFlight = Promise.resolve().then(async () => {
      try {
        const data = await options.load(active.signal);
        if (stopped) return null;
        if (active.signal.aborted) throw new Error('Import monitoring request timed out');
        failures = 0;
        options.onData(data);
        options.onUnavailable(false);
        return data;
      } catch {
        if (!stopped) {
          failures++;
          options.onUnavailable(true);
        }
        return null;
      } finally {
        clearTimeout(timeout);
        controller = undefined;
        inFlight = undefined;
      }
    });
    return inFlight;
  };

  const schedule = (delay: number) => {
    clearTimeout(timer);
    if (stopped) return;
    timer = setTimeout(async () => {
      if (options.isVisible?.() !== false) await refresh();
      schedule(Math.min(60_000, interval * 2 ** Math.min(failures, 3)));
    }, delay);
  };

  return {
    refresh,
    start: (immediate = false) => schedule(immediate ? 0 : interval),
    stop: () => {
      stopped = true;
      clearTimeout(timer);
      controller?.abort();
    },
  };
}
