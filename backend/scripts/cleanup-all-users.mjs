import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
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
  console.log('=== CLEANUP START ===');

  // 1. Delete all IdentityLedger records (cascades to LinkedAccount, RiskEvent, FraudAlert)
  const ledgers = await prisma.identityLedger.count();
  console.log(`Deleting ${ledgers} identity ledgers...`);
  await prisma.identityLedger.deleteMany();

  // 2. Delete all users (cascades to profiles, subscriptions, resumes, AI gen, ATS scores, etc.)
  const users = await prisma.user.count();
  console.log(`Deleting ${users} users...`);
  await prisma.user.deleteMany();

  // 3. Delete all Supabase Auth users
  let authDeleted = 0;
  let cursor = undefined;
  do {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 100 });
    if (error) { console.error('Error listing auth users:', error); break; }
    const authUsers = data?.users || [];
    for (const u of authUsers) {
      const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(u.id);
      if (delErr) console.error(`  Failed to delete auth user ${u.email}:`, delErr.message);
      else { authDeleted++; console.log(`  Deleted auth user: ${u.email}`); }
    }
    cursor = authUsers.length === 100 ? 'more' : undefined;
  } while (cursor);

  console.log(`\n=== CLEANUP COMPLETE ===`);
  console.log(`Deleted ${ledgers} identity ledgers`);
  console.log(`Deleted ${users} Prisma users`);
  console.log(`Deleted ${authDeleted} Supabase Auth users`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
