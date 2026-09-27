'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAnalyticsConsent } from './AnalyticsConsentProvider';
import { sendAnalyticsEvent } from '@/lib/analytics/client';

export function AnalyticsTracker() {
  const pathname = usePathname();
  const consent = useAnalyticsConsent();

  useEffect(() => {
    // Only track page views for public routes to avoid skewing data with admin views
    if (consent === 'granted' && pathname && !pathname.startsWith('/admin')) {
      void sendAnalyticsEvent({ eventName: 'page_view', metadata: { path: pathname } });
    }
  }, [consent, pathname]);

  return null;
}
