import { createHmac } from 'node:crypto';

export function isLikelyBot(userAgent: string) {
  return /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|headless|lighthouse|pagespeed|curl|wget/i.test(
    userAgent,
  );
}

export function utcDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function createAnalyticsDedupeKey(input: {
  anonymousId: string;
  eventName: string;
  entityId: string;
  date?: Date;
}) {
  const secret = process.env.ANALYTICS_HMAC_SECRET || process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error('ANALYTICS_HMAC_SECRET is not configured');
  return createHmac('sha256', secret)
    .update(`${input.anonymousId}:${input.eventName}:${input.entityId}:${utcDayKey(input.date)}`)
    .digest('hex');
}

export function hashAnalyticsIdentifier(value: string) {
  const secret = process.env.ANALYTICS_HMAC_SECRET || process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error('ANALYTICS_HMAC_SECRET is not configured');
  return createHmac('sha256', secret).update(value).digest('hex');
}
