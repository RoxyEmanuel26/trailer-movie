'use client';

import { useEffect } from 'react';
import { sendAnalyticsEvent } from '@/lib/analytics/client';

export function SearchResultsTracker({ query, resultsCount }: { query: string; resultsCount: number }) {
  useEffect(() => {
    if (!query.trim()) return;
    void sendAnalyticsEvent({ eventName: 'search', metadata: { query, resultsCount } });
  }, [query, resultsCount]);
  return null;
}
