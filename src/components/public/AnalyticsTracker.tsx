'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Only track page views for public routes to avoid skewing data with admin views
    if (pathname && !pathname.startsWith('/admin')) {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: 'page_view',
          metadata: { path: pathname },
        }),
        // Use keepalive to ensure request finishes if navigating away
        keepalive: true,
      }).catch(console.error);
    }
  }, [pathname]);

  return null;
}
