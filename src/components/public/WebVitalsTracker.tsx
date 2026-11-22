'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useReportWebVitals } from 'next/web-vitals';
import { useAnalyticsConsent } from './AnalyticsConsentProvider';
import { sendAnalyticsEvent } from '@/lib/analytics/client';

export function WebVitalsTracker() {
  const consent = useAnalyticsConsent();
  const consentRef = useRef(consent);
  const sampled = useRef<boolean | null>(null);

  useEffect(() => {
    consentRef.current = consent;
  }, [consent]);

  const handleMetric = useCallback(
    (metric: { name: string; value: number; rating?: string }) => {
      if (consentRef.current !== 'granted' || !['LCP', 'INP', 'CLS'].includes(metric.name)) return;
      if (!Number.isFinite(metric.value) || metric.value < 0) return;
      if (sampled.current === null) sampled.current = Math.random() < 0.1;
      if (!sampled.current) return;
      void sendAnalyticsEvent({
        eventName: 'web_vital',
        metadata: { name: metric.name, value: metric.value, rating: metric.rating },
      });
    },
    [],
  );

  useReportWebVitals(handleMetric);
  return null;
}
