import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async getUsers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        include: { profile: true, subscription: { include: { plan: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        subscription: { include: { plan: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 10 },
        resumes: { take: 5 },
      },
    });
  }

  async updateUserRole(userId: string, role: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
    });
  }

  async disableUser(userId: string) {
    // Implement user disable logic (e.g., set disabled flag)
    return { message: 'User disabled' };
  }

  async getRevenueSummary() {
    const [totalRevenue, monthlyRevenue, activeSubscriptions, totalUsers] = await Promise.all([
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'succeeded' } }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'succeeded',
          createdAt: { gte: new Date(new Date().setDate(1)) },
        },
      }),
      this.prisma.userSubscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count(),
    ]);

    return {
      totalRevenue: totalRevenue._sum.amount || 0,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      activeSubscriptions,
      totalUsers,
    };
  }

  async getAIMetrics() {
    const total = await this.prisma.aIGeneration.count();
    const totalCost = await this.prisma.aIGeneration.aggregate({
      _sum: { costEgp: true },
    });
    return { totalGenerations: total, totalCost: totalCost._sum.costEgp || 0 };
  }

  async getAuditLogs(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count(),
    ]);
    return { logs, total, page, limit };
  }

  async getFeatureFlags() {
    return this.prisma.featureFlag.findMany();
  }

  async toggleFeatureFlag(id: string, enabled: boolean) {
    return this.prisma.featureFlag.update({ where: { id }, data: { enabled } });
  }

  async getBlogPosts() {
    return this.prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createBlogPost(data: any) {
    return this.prisma.blogPost.create({ data });
  }

  async updateBlogPost(id: string, data: any) {
    return this.prisma.blogPost.update({ where: { id }, data });
  }

  async deleteBlogPost(id: string) {
    await this.prisma.blogPost.delete({ where: { id } });
    return { message: 'Post deleted' };
  }
}
