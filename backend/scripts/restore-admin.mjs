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

const email = 'mazenmohamed3221@gmail.com';
const password = 'Lithy@2025Admin';

async function main() {
  // 1. Create Supabase Auth user
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: 'ADMIN' },
  });
  if (error) { console.error('Supabase create error:', error.message); process.exit(1); }
  const userId = data.user.id;
  console.log(`Created Supabase user: ${email} (${userId})`);

  // 2. Create Prisma user with ADMIN role
  await prisma.user.create({
    data: { id: userId, email, role: 'ADMIN' },
  });
  console.log('Created Prisma user with role ADMIN');

  // 3. Find available Premium plans
  const plans = await prisma.subscriptionPlan.findMany({ where: { isActive: true } });
  console.log('Available plans:', plans.map(p => ({ id: p.id, name: p.name, price: p.price })));

  const premiumPlan = plans.find(p => p.name === 'PREMIUM' || p.name === 'PREMIUM_MONTHLY' || p.name?.includes('PREMIUM'));
  if (premiumPlan) {
    await prisma.userSubscription.create({
      data: {
        userId,
        planId: premiumPlan.id,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
    console.log(`Created Premium subscription (plan: ${premiumPlan.name})`);
  } else {
    console.log('No Premium plan found — creating with free plan instead');
    const freePlan = plans.find(p => p.name === 'FREE');
    if (freePlan) {
      await prisma.userSubscription.create({
        data: { userId, planId: freePlan.id, status: 'ACTIVE' },
      });
    }
  }

  console.log('\n=== DONE ===');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
