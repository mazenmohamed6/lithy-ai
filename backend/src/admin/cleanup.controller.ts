import { Controller, Post, Logger, Query } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ConfigService } from '@nestjs/config';

@Controller('api/v1/admin')
export class CleanupController {
  private readonly logger = new Logger(CleanupController.name);
  constructor(private prisma: PrismaService, private configService: ConfigService) {}

  @Post('reset-db')
  async resetDb(@Query('token') token?: string) {
    const bypassToken = this.configService.get<string>('BYPASS_TOKEN') || process.env.BYPASS_TOKEN;
    if (token !== bypassToken) return { message: 'Unauthorized' };

    const tables = [
      'ai_generations', 'resume_versions', 'resume_exports', 'uploaded_files',
      'cover_letters', 'linkedin_profiles', 'ats_scores', 'job_matches',
      'addon_purchases', 'payments', 'email_logs', 'audit_logs', 'sessions',
      'blog_posts', 'user_subscriptions', 'user_profiles', 'resumes', 'users',
    ];

    for (const table of tables) {
      await this.prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
    }

    return { message: 'Database reset completed' };
  }
}
