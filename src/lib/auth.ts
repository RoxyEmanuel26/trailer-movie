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
  // We can add OAuth providers here later
  /*
  socialProviders: {
    github: { ... },
    google: { ... }
  }
  */
});

export const requireAdmin = async () => {
  // Mocked for now to match the admin layout until auth is fully wired
  return {
    id: "admin-1",
    email: "admin@example.com",
    name: "System Admin",
    role: {
      name: "ADMIN",
      permissions: [{ permission: { action: "manage_all" } }],
    },
  };
};
