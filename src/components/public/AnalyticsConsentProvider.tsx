'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_SETTINGS_EVENT,
  AnalyticsConsent,
  readAnalyticsConsentCookie,
} from '@/lib/analytics/consent';

const AnalyticsConsentContext = createContext<AnalyticsConsent>('unknown');

export function useAnalyticsConsent() {
  return useContext(AnalyticsConsentContext);
}

export function AnalyticsConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<AnalyticsConsent>('unknown');
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const hydrateConsent = window.setTimeout(
      () => setConsent(readAnalyticsConsentCookie(document.cookie)),
      0,
    );
    const openSettings = () => setSettingsOpen(true);
    window.addEventListener(ANALYTICS_SETTINGS_EVENT, openSettings);
    return () => {
      window.clearTimeout(hydrateConsent);
      window.removeEventListener(ANALYTICS_SETTINGS_EVENT, openSettings);
    };
  }, []);

  const choose = useCallback(async (analytics: boolean) => {
    const response = await fetch('/api/analytics/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analytics }),
    });
    if (!response.ok) return;
    const nextConsent: AnalyticsConsent = analytics ? 'granted' : 'denied';
    setConsent(nextConsent);
    setSettingsOpen(false);
    window.dispatchEvent(new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: nextConsent }));
  }, []);

  const contextValue = useMemo(() => consent, [consent]);
  const shouldShow = consent === 'unknown' || settingsOpen;

  return (
    <AnalyticsConsentContext.Provider value={contextValue}>
      {children}
      {shouldShow ? (
        <section
          aria-label="Privacy choices"
          className="fixed inset-x-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] z-[100] mx-auto max-w-3xl rounded-2xl border bg-background/96 p-4 shadow-2xl backdrop-blur sm:inset-x-6 sm:flex sm:items-center sm:gap-5 sm:p-5"
        >
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold">Your privacy choices</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              MovieFlix uses optional, anonymous analytics to understand which movies and trailers
              are useful. Necessary cookies keep your privacy choice; analytics stays off until you accept.
            </p>
          </div>
          <div className="mt-4 grid shrink-0 grid-cols-1 gap-2 min-[430px]:grid-cols-2 sm:mt-0">
            <Button variant="outline" className="min-h-11" onClick={() => void choose(false)}>
              Necessary only
            </Button>
            <Button className="min-h-11" onClick={() => void choose(true)}>
              Accept analytics
            </Button>
          </div>
        </section>
      ) : null}
    </AnalyticsConsentContext.Provider>
  );
}
