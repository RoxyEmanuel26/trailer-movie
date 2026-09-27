'use client';

import { useEffect } from 'react';
import { useAnalyticsConsent } from './AnalyticsConsentProvider';
import { sendAnalyticsEvent } from '@/lib/analytics/client';

export function EntityViewTracker({ eventName, entityId }: { eventName: 'movie_view' | 'person_view'; entityId: string }) {
  const consent = useAnalyticsConsent();

  useEffect(() => {
    if (consent !== 'granted') return;
    if (eventName === 'person_view') {
      void sendAnalyticsEvent({ eventName, entityId });
      return;
    }

    let elapsed = 0;
    let activeSince: number | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let sent = false;

    const clearTimer = () => {
      if (timer) clearTimeout(timer);
      timer = null;
    };
    const pause = () => {
      if (activeSince !== null) elapsed += Date.now() - activeSince;
      activeSince = null;
      clearTimer();
    };
    const qualify = () => {
      if (sent) return;
      sent = true;
      void sendAnalyticsEvent({ eventName, entityId });
    };
    const resume = () => {
      if (sent || activeSince !== null || document.visibilityState !== 'visible' || !document.hasFocus()) return;
      activeSince = Date.now();
      timer = setTimeout(qualify, Math.max(0, 8_000 - elapsed));
    };
    const syncActivity = () => {
      if (document.visibilityState === 'visible' && document.hasFocus()) resume();
      else pause();
    };

    document.addEventListener('visibilitychange', syncActivity);
    window.addEventListener('focus', syncActivity);
    window.addEventListener('blur', pause);
    resume();

    return () => {
      pause();
      document.removeEventListener('visibilitychange', syncActivity);
      window.removeEventListener('focus', syncActivity);
      window.removeEventListener('blur', pause);
    };
  }, [consent, entityId, eventName]);
  return null;
}
