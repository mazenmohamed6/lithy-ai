import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class LinkedInService {
  private readonly logger = new Logger(LinkedInService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async getProfile(userId: string) {
    return this.prisma.linkedInProfile.findFirst({ where: { userId } });
  }

  async saveProfile(userId: string, data: any) {
    const existing = await this.prisma.linkedInProfile.findFirst({ where: { userId } });
    if (existing) {
      return this.prisma.linkedInProfile.update({ where: { id: existing.id }, data });
    }
    return this.prisma.linkedInProfile.create({ data: { userId, ...data } });
  }
}
