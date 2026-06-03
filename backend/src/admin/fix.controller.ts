import { Controller, Post, Logger, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../common/prisma.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('Admin')
@Controller('api/v1/admin')
export class FixController {
  private readonly logger = new Logger(FixController.name);
  constructor(private prisma: PrismaService, private configService: ConfigService) {}

  @Post('fix-features')
  async fixFeatures(@Query('token') token?: string) {
    const bypassToken = this.configService.get<string>('BYPASS_TOKEN') || process.env.BYPASS_TOKEN;
    if (token !== bypassToken) return { message: 'Unauthorized' };

    const plans = await this.prisma.subscriptionPlan.findMany();
    for (const plan of plans) {
      let features = plan.features;
      if (typeof features === 'string') {
        features = JSON.parse(features);
        await this.prisma.subscriptionPlan.update({
          where: { id: plan.id },
          data: { features: features as any },
        });
      }
    }
    return { message: 'Features fixed', count: plans.length };
  }
}
