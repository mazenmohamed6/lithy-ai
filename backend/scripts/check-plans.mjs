import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.subscriptionPlan.findMany();
  for (const p of plans) {
    console.log(`${p.id} (${p.name}):`);
    console.log(`  features:`, JSON.stringify(p.features, null, 2));
    console.log(`  price: ${p.price}, credits: ${p.credits}, isActive: ${p.isActive}`);
  }
  await prisma.$disconnect();
}
main().catch(console.error);
