import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function main() {
  const users = await prisma.user.findMany({ include: { subscription: true } });
  console.log('=== Prisma Users ===');
  for (const u of users) {
    console.log(`  ${u.id} | ${u.email} | role=${u.role} | plan=${u.subscription?.planId}`);
  }

  const { data } = await supabaseAdmin.auth.admin.listUsers();
  console.log('\n=== Supabase Auth Users ===');
  if (data?.users) {
    for (const u of data.users) {
      console.log(`  ${u.id} | ${u.email} | role=${u.role}`);
    }
  }

  const ledgers = await prisma.identityLedger.findMany({
    include: { linkedAccounts: true },
  });
  console.log('\n=== Identity Ledgers ===');
  for (const l of ledgers) {
    console.log(`  ${l.id} accounts=${l.linkedAccounts.length}`);
    for (const a of l.linkedAccounts) {
      console.log(`    - ${a.userId} ${a.email}`);
    }
  }

  await prisma.$disconnect();
}
main().catch(console.error);
