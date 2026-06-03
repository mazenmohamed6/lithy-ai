import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AntiAbuseService } from '../anti-abuse/anti-abuse.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private antiAbuseService: AntiAbuseService,
  ) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true, subscription: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email }, include: { profile: true } });
  }

  async updateProfile(userId: string, data: any) {
    return this.prisma.userProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    let phoneVerified = false;
    try {
      const link = await this.prisma.linkedAccount.findFirst({
        where: { userId, status: 'ACTIVE' },
        select: { ledger: { select: { flags: true } } },
      });
      if (link) {
        const flags: string[] = (link.ledger.flags as any) || [];
        phoneVerified = flags.includes('phone_verified');
      }
    } catch {
      // Non-critical
    }

    return { ...profile, phoneVerified };
  }

  async getUsageStats(userId: string) {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const userIds = [userId];
    try {
      const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
      if (profile?.phone) {
        const samePhoneProfiles = await this.prisma.userProfile.findMany({
          where: { phone: profile.phone },
          select: { userId: true },
        });
        for (const p of samePhoneProfiles) {
          if (!userIds.includes(p.userId)) userIds.push(p.userId);
        }
      }
    } catch {
      // Fall back to single-user stats
    }

    // Get ledger totals (survive account deletion)
    const identityUsage = await this.antiAbuseService.getIdentityUsage(userId);

    const [aiGenerations, atsScans, jobMatches, resumeCount, subscription] = await Promise.all([
      this.prisma.aIGeneration.count({
        where: { userId: { in: userIds }, createdAt: { gte: currentMonth }, status: 'completed' },
      }),
      this.prisma.aTSScore.count({
        where: { userId: { in: userIds }, createdAt: { gte: currentMonth } },
      }),
      this.prisma.jobMatch.count({
        where: { userId: { in: userIds }, createdAt: { gte: currentMonth } },
      }),
      this.prisma.resume.count({ where: { userId: { in: userIds } } }),
      this.prisma.userSubscription.findUnique({
        where: { userId },
        select: { plan: { select: { name: true } }, status: true },
      }),
    ]);

    return {
      aiGenerations,
      atsScans,
      jobMatches,
      resumeCount,
      plan: subscription?.plan?.name || 'FREE',
      planStatus: subscription?.status || null,
      ledgerTotalAiGenerations: identityUsage.ledgerTotalAiGenerations,
      ledgerTotalAtsScans: identityUsage.ledgerTotalAtsScans,
      totalAiGenerations: aiGenerations + identityUsage.ledgerTotalAiGenerations,
      totalAtsScans: atsScans + identityUsage.ledgerTotalAtsScans,
      freePlanExhausted: identityUsage.freePlanExhausted,
    };
  }

  async getSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async exportData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        resumes: { include: { versions: true, exports: true } },
        coverLetters: true,
        atsScores: true,
        jobMatches: true,
        linkedInProfiles: true,
        subscription: true,
        payments: true,
      },
    });
    return user;
  }
}
