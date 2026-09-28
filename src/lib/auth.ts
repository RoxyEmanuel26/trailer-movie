import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';
import { siteConfig } from './site-config';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    cookiePrefix: 'trailer-movie',
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
  trustedOrigins:
    process.env.NODE_ENV === 'production'
      ? [siteConfig.url]
      : [siteConfig.url, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  // We can add OAuth providers here later
  /*
  socialProviders: {
    github: { ... },
    google: { ... }
  }
  */
});
