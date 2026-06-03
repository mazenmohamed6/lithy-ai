import { Controller, Post, Logger, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../common/prisma.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('Admin')
@Controller('api/v1/admin')
export class SeedController {
  private readonly logger = new Logger(SeedController.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  @Post('seed')
  @ApiOperation({ summary: 'Seed subscription plans and addon packs' })
  async seed(@Query('token') token?: string) {
    const bypassToken = this.configService.get<string>('BYPASS_TOKEN') || process.env.BYPASS_TOKEN;
    if (token !== bypassToken) {
      return { message: 'Unauthorized' };
    }
    this.logger.log('Starting database seed...');

    const plans = [
      { id: 'plan_free', name: 'FREE', description: 'Free plan', priceEgp: 0, interval: 'month', stripePriceId: null, features: JSON.stringify({ maxResumes: 3, aiGenerations: 2, atsScans: 2, jobMatches: 2, linkedinOptimizer: false, coverLetters: true, templates: 'basic', pdfExport: true, pdfBranding: true, analytics: false, prioritySupport: false }), sortOrder: 1 },
      { id: 'plan_pro', name: 'PRO', description: 'Professional plan', priceEgp: 75, interval: 'month', stripePriceId: 'price_1Td4zDEqFdud3sNVS1TdRtpa', features: JSON.stringify({ maxResumes: 10, aiGenerations: 10, atsScans: 5, jobMatches: 5, linkedinOptimizer: false, coverLetters: true, templates: 'premium', pdfExport: true, pdfBranding: false, analytics: false, prioritySupport: false }), sortOrder: 2 },
      { id: 'plan_premium', name: 'PREMIUM', description: 'Premium plan', priceEgp: 150, interval: 'month', stripePriceId: 'price_1TdHTKEqFdud3sNVeqXyBbAo', features: JSON.stringify({ maxResumes: -1, aiGenerations: -1, atsScans: -1, jobMatches: -1, linkedinOptimizer: true, coverLetters: true, templates: 'premium', pdfExport: true, pdfBranding: false, analytics: true, prioritySupport: true }), sortOrder: 3 },
    ];

    const annualPlans = [
      { id: 'plan_pro_annual', name: 'PRO_ANNUAL', description: 'Professional annual', priceEgp: 720, interval: 'year', stripePriceId: 'price_1Td50mEqFdud3sNVtHwFwBKT', features: JSON.stringify({ maxResumes: 10, aiGenerations: 10, atsScans: 5, jobMatches: 5, linkedinOptimizer: false, coverLetters: true, templates: 'premium', pdfExport: true, pdfBranding: false, analytics: false, prioritySupport: false }), sortOrder: 4 },
      { id: 'plan_premium_annual', name: 'PREMIUM_ANNUAL', description: 'Premium annual', priceEgp: 1440, interval: 'year', stripePriceId: 'price_1TdKWZEqFdud3sNVIWs7rTT9', features: JSON.stringify({ maxResumes: -1, aiGenerations: -1, atsScans: -1, jobMatches: -1, linkedinOptimizer: true, coverLetters: true, templates: 'premium', pdfExport: true, pdfBranding: false, analytics: true, prioritySupport: true }), sortOrder: 5 },
    ];

    for (const p of [...plans, ...annualPlans]) {
      await this.prisma.subscriptionPlan.upsert({
        where: { name: p.name },
        create: p,
        update: p,
      });
    }

    return { message: 'Seed completed successfully' };
  }
}
