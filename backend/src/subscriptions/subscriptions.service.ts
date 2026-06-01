import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
  ) {}

  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getUserSubscription(userId: string) {
    return this.prisma.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
  }

  async getAddonPacks() {
    return this.prisma.addonPack.findMany({ where: { isActive: true } });
  }

  async getUsageCredits(userId: string) {
    const subscription = await this.prisma.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const usage = await this.prisma.aIGeneration.count({
      where: { userId, createdAt: { gte: currentMonth } },
    });

    const addonPurchases = await this.prisma.addonPurchase.findMany({
      where: { userId },
      include: { pack: true },
    });
    const addonCreditsTotal = addonPurchases.reduce((sum, p) => sum + p.pack.credits, 0);

    const features = (subscription?.plan?.features || '{}') as any;
    const parsed = typeof features === 'string' ? JSON.parse(features) : features;
    const limit = parsed.aiGenerations ?? 0;
    const remaining = limit === -1 ? Infinity : limit - usage;

    return {
      planName: subscription?.plan?.name || 'FREE',
      totalLimit: limit,
      used: usage,
      remaining,
      addonCreditsUsed: 0,
      addonCreditsRemaining: addonCreditsTotal,
    };
  }

  async cancelSubscription(userId: string) {
    const subscription = await this.prisma.userSubscription.findUnique({ where: { userId } });
    if (!subscription) throw new NotFoundException('No active subscription');

    if (subscription.stripeSubscriptionId) {
      await this.paymentsService.cancelStripeSubscription(subscription.stripeSubscriptionId);
    }

    return this.prisma.userSubscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: true },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkTrialExpirations() {
    const now = new Date();
    const expiringTrials = await this.prisma.userSubscription.findMany({
      where: {
        status: 'TRIALING',
        trialEnd: { lte: now },
      },
    });

    for (const trial of expiringTrials) {
      await this.prisma.userSubscription.update({
        where: { id: trial.id },
        data: { status: 'EXPIRED' },
      });
      this.logger.log(`Trial expired for user ${trial.userId}`);
    }
  }
}
