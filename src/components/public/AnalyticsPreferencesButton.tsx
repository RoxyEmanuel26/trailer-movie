'use client';

import { ANALYTICS_SETTINGS_EVENT } from '@/lib/analytics/consent';

export function AnalyticsPreferencesButton() {
  return (
    <button
      type="button"
      className="flex min-h-8 items-center hover:text-foreground"
      onClick={() => window.dispatchEvent(new Event(ANALYTICS_SETTINGS_EVENT))}
    >
      Privacy choices
    </button>
  );
}
