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

const ADMIN_EMAIL = 'mazenmohamed3221@gmail.com';

async function main() {
  // 1. Find admin user ID
  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) { console.error('Admin not found'); process.exit(1); }
  const adminId = admin.id;
  console.log(`Admin: ${admin.email} (${adminId})`);

  // 2. Delete identity ledgers that don't belong to admin
  const ledgers = await prisma.identityLedger.findMany({
    include: { linkedAccounts: true },
  });
  for (const l of ledgers) {
    const hasAdmin = l.linkedAccounts.some(a => a.userId === adminId);
    if (!hasAdmin) {
      console.log(`Deleting ledger ${l.id} (${l.linkedAccounts.length} accounts, none admin)`);
      await prisma.identityLedger.delete({ where: { id: l.id } });
    } else {
      // Remove non-admin linked accounts from this ledger
      for (const a of l.linkedAccounts) {
        if (a.userId !== adminId) {
          console.log(`Removing linked account ${a.userId} ${a.email} from ledger ${l.id}`);
          await prisma.linkedAccount.delete({ where: { id: a.id } });
        }
      }
    }
  }

  // 3. Delete non-admin Prisma users
  const users = await prisma.user.findMany({ where: { id: { not: adminId } } });
  for (const u of users) {
    console.log(`Deleting Prisma user: ${u.email} (${u.id})`);
    await prisma.user.delete({ where: { id: u.id } });
  }

  // 4. Delete non-admin Supabase Auth users
  const { data } = await supabaseAdmin.auth.admin.listUsers();
  if (data?.users) {
    for (const u of data.users) {
      if (u.email !== ADMIN_EMAIL) {
        console.log(`Deleting auth user: ${u.email} (${u.id})`);
        const { error } = await supabaseAdmin.auth.admin.deleteUser(u.id);
        if (error) console.error(`  Failed: ${error.message}`);
      }
    }
  }

  console.log('\n=== Cleanup complete ===');
  console.log(`Kept admin: ${ADMIN_EMAIL}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
