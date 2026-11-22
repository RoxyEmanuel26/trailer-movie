export interface MemoryCacheOptions {
  maxEntries: number;
  ttlMs: number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const GLOBAL_CACHE_REGISTRY_KEY = '__movieflixActiveMemoryCaches';

function getActiveCacheRegistry(): Set<{ clear: () => void }> {
  const globalStore = globalThis as typeof globalThis & {
    [GLOBAL_CACHE_REGISTRY_KEY]?: Set<{ clear: () => void }>;
  };
  if (!globalStore[GLOBAL_CACHE_REGISTRY_KEY]) {
    globalStore[GLOBAL_CACHE_REGISTRY_KEY] = new Set();
  }
  return globalStore[GLOBAL_CACHE_REGISTRY_KEY];
}

export function clearAllPublicMemoryCaches() {
  for (const cacheInstance of getActiveCacheRegistry()) {
    cacheInstance.clear();
  }
}

export function createMemoryCache<T>(options: MemoryCacheOptions) {
  const store = new Map<string, CacheEntry<T>>();
  const inFlight = new Map<string, Promise<T>>();
  let epoch = 0;
  const { maxEntries, ttlMs } = options;

  const instance = {
    get(key: string): T | undefined {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return undefined;
      }
      // Refresh LRU order
      store.delete(key);
      store.set(key, entry);
      return entry.value;
    },

    set(key: string, value: T, customTtlMs = ttlMs): void {
      if (store.has(key)) {
        store.delete(key);
      } else if (store.size >= maxEntries) {
        const oldestKey = store.keys().next().value;
        if (oldestKey !== undefined) {
          store.delete(oldestKey);
        }
      }
      store.set(key, {
        value,
        expiresAt: Date.now() + customTtlMs,
      });
    },

    async getOrLoad(key: string, loader: () => Promise<T>, customTtlMs = ttlMs): Promise<T> {
      const cached = instance.get(key);
      if (cached !== undefined) {
        return cached;
      }

      const existingPromise = inFlight.get(key);
      if (existingPromise) {
        return existingPromise;
      }

      const startEpoch = epoch;
      const promise: Promise<T> = loader()
        .then((result) => {
          const isCurrent = epoch === startEpoch && inFlight.get(key) === promise;
          if (inFlight.get(key) === promise) {
            inFlight.delete(key);
          }
          if (isCurrent) {
            // Do not cache null/undefined for long if an entity is missing, or cache briefly (30s) to prevent 404 stampedes
            if (result === null || result === undefined) {
              instance.set(key, result, Math.min(customTtlMs, 30_000));
            } else {
              instance.set(key, result, customTtlMs);
            }
          }
          return result;
        })
        .catch((err) => {
          if (inFlight.get(key) === promise) {
            inFlight.delete(key);
          }
          throw err;
        });

      inFlight.set(key, promise);
      return promise;
    },

    delete(key: string): void {
      store.delete(key);
      inFlight.delete(key);
    },

    clear(): void {
      epoch += 1;
      store.clear();
      inFlight.clear();
    },
  };

  getActiveCacheRegistry().add(instance);
  return instance;
}
