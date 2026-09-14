'use client';

import { useEffect } from 'react';

export function SearchResultsTracker({ query, resultsCount }: { query: string; resultsCount: number }) {
  useEffect(() => {
    if (!query.trim()) return;
    fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName: 'search', metadata: { query, resultsCount } }),
      keepalive: true,
    }).catch(() => undefined);
  }, [query, resultsCount]);
  return null;
}
