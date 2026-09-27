'use client';

import { useRef } from 'react';
import { useReportWebVitals } from 'next/web-vitals';
import { useAnalyticsConsent } from './AnalyticsConsentProvider';
import { sendAnalyticsEvent } from '@/lib/analytics/client';

export function WebVitalsTracker() {
  const consent = useAnalyticsConsent();
  const sampled = useRef<boolean | null>(null);

  useReportWebVitals((metric) => {
    if (consent !== 'granted' || !['LCP', 'INP', 'CLS'].includes(metric.name)) return;
    if (sampled.current === null) sampled.current = Math.random() < 0.1;
    if (!sampled.current) return;
    void sendAnalyticsEvent({
      eventName: 'web_vital',
      metadata: { name: metric.name, value: metric.value, rating: metric.rating },
    });
  });
  return null;
}
