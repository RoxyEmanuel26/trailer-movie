import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';
import { siteConfig } from './site-config';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL?.trim() || siteConfig.url,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  advanced: {
    cookiePrefix: 'trailer-movie',
    useSecureCookies: process.env.NODE_ENV === 'production',
    ipAddress: {
      ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for'],
    },
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
