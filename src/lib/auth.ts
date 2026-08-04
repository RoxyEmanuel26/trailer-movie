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
  // We can add OAuth providers here later
  /*
  socialProviders: {
    github: { ... },
    google: { ... }
  }
  */
});

import { headers } from 'next/headers';
import { UnauthorizedError, PermissionError } from './errors';

export const requireAdmin = async () => {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || !session.user) {
    throw new UnauthorizedError('You must be logged in to perform this action');
  }

  const userWithRole = session.user as any;

  if (!userWithRole.roleId) {
    throw new UnauthorizedError('You must be logged in to perform this action');
  }

  const role = await prisma.role.findUnique({
    where: { id: userWithRole.roleId },
    include: { permissions: { include: { permission: true } } }
  });

  if (!role || role.name !== 'ADMIN') {
    throw new PermissionError('You do not have permission to access this resource');
  }

  return {
    ...session.user,
    role,
  };
};
