import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';

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
  trustedOrigins: ['http://localhost:3000', 'http://192.168.100.7:3000'],
  // We can add OAuth providers here later
  /*
  socialProviders: {
    github: { ... },
    google: { ... }
  }
  */
});

