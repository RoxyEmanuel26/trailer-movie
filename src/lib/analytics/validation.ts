import { z } from 'zod';
import { siteConfig } from '@/lib/site-config';

const smallPrimitiveValue = z.union([z.string().max(128), z.number().finite(), z.boolean()]);

const boundedGenericMetadata = z
  .record(z.string().max(48), smallPrimitiveValue)
  .refine((obj) => Object.keys(obj).length <= 8, 'Too many metadata fields')
  .optional();

export const analyticsEventSchema = z.discriminatedUnion('eventName', [
  z.object({
    eventName: z.literal('page_view'),
    entityId: z.string().max(128).optional(),
    metadata: z
      .object({
        path: z.string().min(1).max(512).default('/'),
      })
      .optional(),
  }),
  z.object({
    eventName: z.literal('movie_view'),
    entityId: z.string().min(1).max(128),
    metadata: boundedGenericMetadata,
  }),
  z.object({
    eventName: z.literal('person_view'),
    entityId: z.string().min(1).max(128),
    metadata: boundedGenericMetadata,
  }),
  z.object({
    eventName: z.literal('trailer_play'),
    entityId: z.string().min(1).max(128),
    metadata: z
      .object({
        trailerId: z.string().max(64).optional(),
      })
      .optional(),
  }),
  z.object({
    eventName: z.literal('trailer_complete'),
    entityId: z.string().max(128).optional(),
    metadata: z
      .object({
        trailerId: z.string().max(64).optional(),
      })
      .optional(),
  }),
  z.object({
    eventName: z.literal('search'),
    entityId: z.string().max(128).optional(),
    metadata: z.object({
      query: z.string().max(200),
      resultsCount: z.number().int().min(0).max(1_000_000).default(0),
    }),
  }),
  z.object({
    eventName: z.literal('web_vital'),
    entityId: z.string().max(128).optional(),
    metadata: z.object({
      name: z.enum(['LCP', 'INP', 'CLS']),
      value: z.number().finite().min(0).max(120_000),
      rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
    }),
  }),
  z.object({
    eventName: z.literal('filter_apply'),
    entityId: z.string().max(128).optional(),
    metadata: boundedGenericMetadata,
  }),
  z.object({
    eventName: z.literal('pagination'),
    entityId: z.string().max(128).optional(),
    metadata: boundedGenericMetadata,
  }),
  z.object({
    eventName: z.literal('homepage_click'),
    entityId: z.string().max(128).optional(),
    metadata: boundedGenericMetadata,
  }),
]);

export type AnalyticsEventPayload = z.infer<typeof analyticsEventSchema>;

export function isAllowedAnalyticsOrigin(
  origin: string | null,
  requestOrigin?: string,
  nodeEnv: string = process.env.NODE_ENV || 'development',
): boolean {
  if (!origin) return true;
  try {
    const normalizedOrigin = new URL(origin).origin;
    const allowed = new Set<string>([new URL(siteConfig.url).origin]);
    if (nodeEnv !== 'production') {
      if (requestOrigin) {
        try {
          allowed.add(new URL(requestOrigin).origin);
        } catch {
          // Ignore malformed internal origin
        }
      }
      allowed.add('http://localhost:3000');
      allowed.add('http://127.0.0.1:3000');
    }
    return allowed.has(normalizedOrigin);
  } catch {
    return false;
  }
}

export function sanitizeAnalyticsSearchQuery(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '[redacted-phone]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}
