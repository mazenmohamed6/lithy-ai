import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  const gens = await prisma.aIGeneration.findMany({ orderBy: { createdAt: 'desc' } });
  console.log(`Total AI generations: ${gens.length}`);
  for (const g of gens) {
    console.log(`  id=${g.id} userId=${g.userId} type=${g.type} status=${g.status} createdAt=${g.createdAt}`);
  }

  // Check all users and their subscriptions
  const users = await prisma.user.findMany({
    include: { subscription: true, linkedAccounts: true },
  });
  console.log(`\nTotal users: ${users.length}`);
  for (const u of users) {
    console.log(`  ${u.id} email=${u.email} role=${u.role} plan=${u.subscription?.planId}`);
  }
  await prisma.$disconnect();
}
main().catch(console.error);
