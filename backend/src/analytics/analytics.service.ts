import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async trackEvent(userId: string, event: string, properties?: any) {
    // Log to PostHog (via separate PostHog service or direct API)
    // For now, store in audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: event,
        details: properties || {},
      },
    });
  }

  async getUserAnalytics(userId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [resumesCreated, aiGenerations, atsScans, exports] = await Promise.all([
      this.prisma.resume.count({
        where: { userId, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.aIGeneration.count({
        where: { userId, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.aTSScore.count({
        where: { userId, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.resumeExport.count({
        where: { resume: { userId }, createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    return { resumesCreated, aiGenerations, atsScans, exports };
  }

  async getRevenueAnalytics(startDate: Date, endDate: Date) {
    const payments = await this.prisma.payment.findMany({
      where: { createdAt: { gte: startDate, lte: endDate }, status: 'succeeded' },
      orderBy: { createdAt: 'asc' },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const monthlyBreakdown = this.groupByMonth(payments);

    return { totalRevenue, payments, monthlyBreakdown };
  }

  private groupByMonth(payments: any[]) {
    const grouped: Record<string, number> = {};
    for (const p of payments) {
      const key = p.createdAt.toISOString().slice(0, 7);
      grouped[key] = (grouped[key] || 0) + p.amount;
    }
    return grouped;
  }
}
