import 'dotenv/config';
import { auth } from './src/lib/auth';
import { prisma } from './src/lib/prisma';

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@admin.com';
  const password = process.env.ADMIN_PASSWORD || 'password123';
  const name = 'Admin';

  console.log("Checking if admin " + email + " exists...");
  const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  
  let userRecord = existingUser;

  if (!existingUser) {
    try {
      const res = await auth.api.signUpEmail({
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

  // Define and assign all necessary permissions for full dashboard access
  const adminPermissions = [
    'read:imports', 'create:imports', 'update:imports', 'delete:imports', 'write:imports',
    'read:movies', 'create:movies', 'update:movies', 'delete:movies', 'write:movies',
    'read:settings', 'update:settings', 'write:settings'
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
}

seedAdmin().finally(() => prisma.$disconnect());
