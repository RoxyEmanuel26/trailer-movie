'use client';

import { useReportWebVitals } from 'next/web-vitals';

const sampled = Math.random() < 0.1;

export function WebVitalsTracker() {
  useReportWebVitals((metric) => {
    if (!sampled || !['LCP', 'INP', 'CLS'].includes(metric.name)) return;
    fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'web_vital',
        metadata: { name: metric.name, value: metric.value, rating: metric.rating },
      }),
      keepalive: true,
    }).catch(() => undefined);
  });
  return null;
}
