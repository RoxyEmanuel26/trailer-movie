'use client';

import { useEffect } from 'react';

export function EntityViewTracker({ eventName, entityId }: { eventName: 'movie_view' | 'person_view'; entityId: string }) {
  useEffect(() => {
    fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName, entityId }),
      keepalive: true,
    }).catch(() => undefined);
  }, [entityId, eventName]);
  return null;
}
