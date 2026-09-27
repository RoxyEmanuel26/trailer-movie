'use client';

import { readAnalyticsConsentCookie } from './consent';

export function hasAnalyticsConsent() {
  return typeof document !== 'undefined' && readAnalyticsConsentCookie(document.cookie) === 'granted';
}

export async function sendAnalyticsEvent(payload: {
  eventName: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!hasAnalyticsConsent()) return false;

  const response = await fetch('/api/analytics/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  });

  return response.ok;
}
