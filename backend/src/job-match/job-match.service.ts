import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class JobMatchService {
  constructor(private prisma: PrismaService) {}

  async getHistory(userId: string) {
    return this.prisma.jobMatch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }
}
