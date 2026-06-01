import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
    return profile;
  }

  async getUsageStats(userId: string) {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const [aiGenerations, atsScans, jobMatches, resumeCount] = await Promise.all([
      this.prisma.aIGeneration.count({
        where: { userId, createdAt: { gte: currentMonth } },
      }),
      this.prisma.aTSScore.count({
        where: { userId, createdAt: { gte: currentMonth } },
      }),
      this.prisma.jobMatch.count({
        where: { userId, createdAt: { gte: currentMonth } },
      }),
      this.prisma.resume.count({ where: { userId } }),
    ]);

    return { aiGenerations, atsScans, jobMatches, resumeCount };
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
