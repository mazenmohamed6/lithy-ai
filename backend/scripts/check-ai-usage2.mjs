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
    console.log(`  userId=${g.userId} type=${g.type} status=${g.status} createdAt=${g.createdAt}`);
  }

  // Count per user
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  for (const u of users) {
    const count = await prisma.aIGeneration.count({ where: { userId: u.id } });
    const resumes = await prisma.resume.count({ where: { userId: u.id } });
    console.log(`User ${u.email} (${u.id}): AI=${count}, Resumes=${resumes}`);
  }

  // Check user subscriptions
  const subs = await prisma.userSubscription.findMany({ include: { plan: true } });
  for (const s of subs) {
    const user = await prisma.user.findUnique({ where: { id: s.userId }, select: { email: true } });
    console.log(`Subscription: ${user?.email} plan=${s.plan.name} status=${s.status}`);
  }

  await prisma.$disconnect();
}
main().catch(console.error);
