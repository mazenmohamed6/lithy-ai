import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  const ledgers = await prisma.identityLedger.findMany({
    include: {
      linkedAccounts: true,
      riskEvents: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });
  console.log(`Total ledgers: ${ledgers.length}\n`);
  for (const l of ledgers) {
    console.log(`Ledger ${l.id}:`);
    console.log(`  deviceFP: ${l.deviceFingerprint?.substring(0,20) || '—'}`);
    console.log(`  browserFP: ${l.browserFingerprint?.substring(0,20) || '—'}`);
    console.log(`  riskLevel: ${l.riskLevel}, riskScore: ${l.riskScore}`);
    console.log(`  freePlanActivated: ${l.freePlanActivated}, freePlanExhausted: ${l.freePlanExhausted}`);
    console.log(`  totalAi: ${l.totalAiGenerations}, totalAts: ${l.totalAtsScans}`);
    console.log(`  Linked accounts (${l.linkedAccounts.length}):`);
    for (const a of l.linkedAccounts) {
      console.log(`    - userId: ${a.userId} email: ${a.email} status: ${a.status} ips: ${JSON.stringify(a.ipAddresses)} ua: ${a.userAgents?.[0]?.substring(0,50)}`);
    }
    console.log(`  Recent events:`);
    for (const e of l.riskEvents) {
      console.log(`    - ${e.eventType}: ${JSON.stringify(e.details).substring(0,100)}`);
    }
    console.log('');
  }

  await prisma.$disconnect();
}
main().catch(console.error);
