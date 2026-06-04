import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ResumesModule } from './resumes/resumes.module';
import { CoverLettersModule } from './cover-letters/cover-letters.module';
import { AtsModule } from './ats/ats.module';
import { JobMatchModule } from './job-match/job-match.module';
import { LinkedInModule } from './linkedin/linkedin.module';
import { AiModule } from './ai/ai.module';
import { PaymentsModule } from './payments/payments.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AdminModule } from './admin/admin.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { EmailModule } from './email/email.module';
import { StorageModule } from './storage/storage.module';
import { AntiAbuseModule } from './anti-abuse/anti-abuse.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ResumesModule,
    CoverLettersModule,
    AtsModule,
    JobMatchModule,
    LinkedInModule,
    AiModule,
    PaymentsModule,
    SubscriptionsModule,
    AdminModule,
    AnalyticsModule,
    EmailModule,
    StorageModule,
    AntiAbuseModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
