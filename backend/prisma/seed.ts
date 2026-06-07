import { PrismaClient, AddonType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const plans = [
    {
      id: 'plan_free',
      name: 'FREE',
      description: 'Get started with basic resume building',
      priceEgp: 0,
      interval: 'month',
      stripePriceId: null,
      features: JSON.stringify({
        maxResumes: 3,
        aiGenerations: 2,
        atsScans: 2,
        jobMatches: 2,
        linkedinOptimizer: false,
        coverLetters: true,
        templates: 'basic',
        pdfExport: true,
        pdfBranding: true,
        analytics: false,
        prioritySupport: false,
      }),
      sortOrder: 1,
    },
    {
      id: 'plan_pro',
      name: 'PRO',
      description: 'Professional resume building with AI power',
      priceEgp: 75,
      interval: 'month',
      stripePriceId: 'price_1TeLrXEqFdud3sNVuVvVEiAZ',
      features: JSON.stringify({
        maxResumes: 10,
        aiGenerations: 10,
        atsScans: 5,
        jobMatches: 5,
        linkedinOptimizer: false,
        coverLetters: true,
        templates: 'premium',
        pdfExport: true,
        pdfBranding: false,
        analytics: false,
        prioritySupport: false,
      }),
      sortOrder: 2,
    },
    {
      id: 'plan_pro_annual',
      name: 'PRO_ANNUAL',
      description: 'Professional resume building - annual (20% off)',
      priceEgp: 720,
      interval: 'year',
      stripePriceId: 'price_1TeLrXEqFdud3sNVZOJSZW55',
      features: JSON.stringify({
        maxResumes: 10,
        aiGenerations: 10,
        atsScans: 5,
        jobMatches: 5,
        linkedinOptimizer: false,
        coverLetters: true,
        templates: 'premium',
        pdfExport: true,
        pdfBranding: false,
        analytics: false,
        prioritySupport: false,
      }),
      sortOrder: 3,
    },
    {
      id: 'plan_premium',
      name: 'PREMIUM',
      description: 'Unlimited AI-powered career tools',
      priceEgp: 150,
      interval: 'month',
      stripePriceId: 'price_1TeLrYEqFdud3sNVWsTu2Paw',
      features: JSON.stringify({
        maxResumes: -1,
        aiGenerations: -1,
        atsScans: -1,
        jobMatches: -1,
        linkedinOptimizer: true,
        coverLetters: true,
        templates: 'premium',
        pdfExport: true,
        pdfBranding: false,
        analytics: true,
        prioritySupport: true,
      }),
      sortOrder: 4,
    },
    {
      id: 'plan_premium_annual',
      name: 'PREMIUM_ANNUAL',
      description: 'Unlimited career tools - annual (20% off)',
      priceEgp: 1440,
      interval: 'year',
      stripePriceId: 'price_1TeLrYEqFdud3sNVZVgey8Qr',
      features: JSON.stringify({
        maxResumes: -1,
        aiGenerations: -1,
        atsScans: -1,
        jobMatches: -1,
        linkedinOptimizer: true,
        coverLetters: true,
        templates: 'premium',
        pdfExport: true,
        pdfBranding: false,
        analytics: true,
        prioritySupport: true,
      }),
      sortOrder: 5,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      create: plan,
      update: plan,
    });
  }

  // Add-on packs
  const addonPacks = [
    {
      id: 'addon_ai_10',
      type: AddonType.AI_GENERATION,
      credits: 10,
      priceEgp: 30,
      stripePriceId: 'price_1TeLrZEqFdud3sNV0ATOVwKU',
    },
  ];

  for (const pack of addonPacks) {
    await prisma.addonPack.upsert({
      where: { id: pack.id },
      create: pack,
      update: pack,
    });
  }

  // Feature flags
  const flags = [
    { key: 'resume_upload_ocr', enabled: true },
    { key: 'linkedin_optimizer', enabled: true },
    { key: 'public_resume_sharing', enabled: true },
    { key: 'ai_resume_generation', enabled: true },
    { key: 'cover_letter_generation', enabled: true },
    { key: 'ats_scoring', enabled: true },
    { key: 'job_match_analysis', enabled: true },
    { key: 'addon_packs', enabled: true },
    { key: 'referral_program', enabled: false },
    { key: 'team_accounts', enabled: false },
  ];

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      create: flag,
      update: flag,
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
