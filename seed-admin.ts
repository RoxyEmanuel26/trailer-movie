import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

for (const envFile of ['.env.production.local', '.env']) {
  const fullPath = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath, override: false });
  }
}

async function seedAdmin() {
  const isProd = process.env.NODE_ENV === 'production';
  const email = process.env.ADMIN_EMAIL?.trim() || (isProd ? '' : 'admin@admin.com');
  const password = process.env.ADMIN_PASSWORD?.trim() || (isProd ? '' : 'password123');
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be explicitly configured when NODE_ENV=production');
  }
  const name = 'Admin';

  const { prisma } = await import('./src/lib/prisma');
  const seedAuth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000',
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      enabled: true,
    },
  });

  try {
    console.log('Checking if admin ' + email + ' exists...');
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    
    let userRecord = existingUser;

    if (!existingUser) {
      try {
        const res = await seedAuth.api.signUpEmail({
          body: {
            email,
            password,
            name,
          }
        });
        userRecord = res.user as any;
        console.log('Admin user created successfully.');
      } catch (err) {
        console.error('Failed to create admin:', err);
        return;
      }
    } else {
      console.log('Admin user already exists.');
    }

    // Ensure Admin Role exists
    let adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: { name: 'Admin' }
      });
      console.log('Created Admin role.');
    }

    // Define and assign all necessary canonical permissions for full dashboard access
    const adminPermissions = [
      'read:imports', 'write:imports', 'create:imports', 'update:imports', 'delete:imports',
      'read:movies', 'write:movies', 'create:movies', 'update:movies', 'delete:movies',
      'read:collections', 'write:collections', 'create:collections', 'update:collections', 'delete:collections',
      'read:genres', 'write:genres', 'create:genres', 'update:genres', 'delete:genres',
      'read:tags', 'write:tags', 'create:tags', 'update:tags', 'delete:tags',
      'read:homepage', 'write:homepage', 'create:homepage', 'update:homepage', 'delete:homepage',
      'read:seo', 'write:seo', 'update:seo',
      'read:analytics', 'write:analytics',
      'read:audit',
      'read:settings', 'write:settings', 'update:settings',
    ];

    for (const action of adminPermissions) {
      let perm = await prisma.permission.findUnique({ where: { action } });
      if (!perm) {
        perm = await prisma.permission.create({ data: { action } });
      }
      
      // Link to role
      const existingLink = await prisma.rolePermission.findUnique({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } }
      });
      if (!existingLink) {
        await prisma.rolePermission.create({
          data: { roleId: adminRole.id, permissionId: perm.id }
        });
      }
    }
    console.log('Linked full permissions to Admin role.');

    if (userRecord && userRecord.roleId !== adminRole.id) {
      await prisma.user.update({
        where: { id: userRecord.id },
        data: { roleId: adminRole.id }
      });
      console.log('Assigned Admin role to user.');
    } else {
      console.log('User already has Admin role.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
