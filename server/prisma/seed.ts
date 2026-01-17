/**
 * Prisma Seed Script
 * Creates the initial admin user from environment variables
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@j-innov.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);

  console.log('🌱 Seeding database...');

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`✅ Admin user already exists: ${adminEmail}`);
    return;
  }

  // Hash the password
  const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log(`✅ Admin user created successfully!`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Role: ${admin.role}`);
  console.log(`   ID: ${admin.id}`);

  // Create initial audit log
  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: 'SEED_ADMIN',
      targetType: 'USER',
      targetId: admin.id,
      metadata: JSON.stringify({ seededAt: new Date().toISOString() }),
    },
  });

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
