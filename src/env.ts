import { z } from 'zod';

const envSchema = z.object({
  // Node
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid connection string'),

  // Authentication
  BETTER_AUTH_SECRET: z.string().min(16, 'BETTER_AUTH_SECRET must be at least 16 characters long'),

  // External APIs
  TMDB_ACCESS_TOKEN: z.string().min(1, 'TMDB_ACCESS_TOKEN is required'),

  // Public SEO configuration
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_NAME: z.string().min(1).optional(),
  NEXT_PUBLIC_TWITTER_HANDLE: z.string().optional(),
  GOOGLE_SITE_VERIFICATION: z.string().optional(),
  CONTACT_EMAIL: z.string().email().optional(),
  SEO_INDEXING_ENABLED: z.enum(['true', 'false']).default('false'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:\n', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
