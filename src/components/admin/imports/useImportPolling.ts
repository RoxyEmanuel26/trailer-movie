'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createImportPoller } from '@/lib/import-poller';

export function useImportPolling<T>(
  load: (signal: AbortSignal) => Promise<T>,
  onData: (data: T) => void,
  initialUnavailable = false,
) {
  const [unavailable, setUnavailable] = useState(initialUnavailable);
  const poller = useRef<ReturnType<typeof createImportPoller<T>> | null>(null);

  useEffect(() => {
    const current = createImportPoller({
      load, onData, onUnavailable: setUnavailable,
      isVisible: () => document.visibilityState !== 'hidden',
    });
    poller.current = current;
    current.start(initialUnavailable);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') current.start(true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      current.stop();
      if (poller.current === current) poller.current = null;
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [load, onData, initialUnavailable]);

  const refresh = useCallback(() => poller.current?.refresh() ?? Promise.resolve(null), []);
  return { unavailable, refresh };
}
