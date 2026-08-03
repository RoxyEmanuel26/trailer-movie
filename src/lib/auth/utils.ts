import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function getCurrentSession() {
  const reqHeaders = await headers();
  return auth.api.getSession({
    headers: reqHeaders,
  });
}

export async function requireUser() {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireAdmin(action?: string) {
  const session = await requireUser();
  const user = session.user;

  // The database schema uses custom Role/Permission for admin rights
  // The user object returned by Better Auth will have 'roleId' if we typed it correctly,
  // but to be safe we can query the DB.

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (!dbUser || !dbUser.isActive) {
    throw new Error('Unauthorized: Account inactive or not found');
  }

  if (!dbUser.role) {
    throw new Error('Forbidden: No assigned role');
  }

  if (action) {
    const hasPermission = dbUser.role.permissions.some((rp) => rp.permission.action === action);
    if (!hasPermission) {
      throw new Error(`Forbidden: Missing required permission '${action}'`);
    }
  }

  return { session, user: dbUser };
}
