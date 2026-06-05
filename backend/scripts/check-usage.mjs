import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  // Check ledger-linked users and their AI generation counts
  const ledgers = await prisma.identityLedger.findMany({
    include: { linkedAccounts: { where: { status: 'ACTIVE', userId: { not: null } } } }
  });

  for (const l of ledgers) {
    const userIds = l.linkedAccounts.map(a => a.userId).filter(Boolean);
    console.log(`Ledger ${l.id}`);
    console.log(`  totalAiGenerations (stored): ${l.totalAiGenerations}`);
    console.log(`  totalAtsScans (stored): ${l.totalAtsScans}`);
    console.log(`  Active user IDs: ${userIds.join(', ')}`);

    for (const uid of userIds) {
      const [aiCount, atsCount] = await Promise.all([
        prisma.aIGeneration.count({ where: { userId: uid, status: 'completed' } }),
        prisma.aTSScore.count({ where: { userId: uid } }),
      ]);
      console.log(`  User ${uid}: AI=${aiCount}, ATS=${atsCount}`);
    }

    // Total across all linked active accounts (excluding each user)
    const allAi = await prisma.aIGeneration.count({
      where: { userId: { in: userIds }, status: 'completed' },
    });
    console.log(`  Total AI across all linked accounts: ${allAi}`);
    console.log('');
  }

  // Check subscription plans
  const plans = await prisma.subscriptionPlan.findMany();
  console.log('Plans:');
  for (const p of plans) {
    console.log(`  ${p.id}: ${p.name} features=${p.features}`);
  }

  await prisma.$disconnect();
}
main().catch(console.error);
