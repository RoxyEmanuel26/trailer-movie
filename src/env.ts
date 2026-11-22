import { z } from 'zod';

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (typeof value === 'string' && value.trim() === '' ? undefined : value), schema);

const envSchema = z.object({
  // Node
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid connection string'),
  DATABASE_DRIVER: emptyToUndefined(z.enum(['pg', 'neon']).optional()),

  // Authentication
  BETTER_AUTH_SECRET: z.string().min(16, 'BETTER_AUTH_SECRET must be at least 16 characters long'),
  BETTER_AUTH_URL: emptyToUndefined(z.string().url().optional()),

  // External APIs
  // Only the local import worker needs TMDB. Public Cloudflare pages do not.
  TMDB_ACCESS_TOKEN: emptyToUndefined(z.string().min(1).optional()),

  // Public SEO configuration
  NEXT_PUBLIC_APP_URL: emptyToUndefined(z.string().url().optional()),
  NEXT_PUBLIC_TWITTER_HANDLE: emptyToUndefined(z.string().optional()),
  GOOGLE_SITE_VERIFICATION: emptyToUndefined(z.string().optional()),
  CONTACT_EMAIL: emptyToUndefined(z.string().email().optional()),
  SEO_INDEXING_ENABLED: emptyToUndefined(z.enum(['true', 'false']).optional()).default('false'),
  ORIGIN_GATE_SECRET: emptyToUndefined(z.string().min(32).optional()),
  ANALYTICS_HMAC_SECRET: emptyToUndefined(z.string().min(32).optional()),
  REVALIDATION_SECRET: emptyToUndefined(z.string().min(32).optional()),
  REVALIDATION_BASE_URL: emptyToUndefined(z.string().url().optional()),
  APP_RELEASE_SHA: emptyToUndefined(z.string().min(7).optional()),
  SITEMAP_CACHE_DIR: emptyToUndefined(z.string().min(1).optional()),
  INDEXNOW_KEY: emptyToUndefined(z.string().min(8).max(128).regex(/^[a-zA-Z0-9-]+$/).optional()),
  IMPORT_HEALTHCHECK_URL: emptyToUndefined(z.string().url().optional()),
  IMPORT_DB_POOL_MAX: emptyToUndefined(z.coerce.number().int().min(1).max(20).optional()),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:\n', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
