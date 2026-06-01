import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private prisma: PrismaService) {}

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

    const planLimits: Record<string, number> = {
      FREE: 0,
      PRO: 10,
      PREMIUM: Infinity,
    };

    const limit = planLimits[subscription?.plan?.name || 'FREE'] || 0;
    const remaining = limit === Infinity ? Infinity : limit - usage;

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
