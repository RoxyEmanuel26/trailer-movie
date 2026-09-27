export const ANALYTICS_CONSENT_COOKIE = 'movieflix_analytics_consent';
export const ANALYTICS_ID_COOKIE = 'movieflix_analytics_id';
export const ANALYTICS_CONSENT_EVENT = 'movieflix:analytics-consent-changed';
export const ANALYTICS_SETTINGS_EVENT = 'movieflix:open-analytics-settings';
export const ANALYTICS_CONSENT_MAX_AGE = 60 * 60 * 24 * 365;

export type AnalyticsConsent = 'granted' | 'denied' | 'unknown';

export function readAnalyticsConsentCookie(cookieValue: string): AnalyticsConsent {
  const match = cookieValue
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ANALYTICS_CONSENT_COOKIE}=`));
  const value = match?.split('=')[1];
  return value === 'granted' || value === 'denied' ? value : 'unknown';
}
