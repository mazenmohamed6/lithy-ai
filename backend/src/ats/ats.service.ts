import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AtsService {
  private readonly logger = new Logger(AtsService.name);

  constructor(private prisma: PrismaService) {}

  async getScoreHistory(userId: string) {
    return this.prisma.aTSScore.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async getScoreById(id: string, userId: string) {
    return this.prisma.aTSScore.findFirst({ where: { id, userId } });
  }
}
