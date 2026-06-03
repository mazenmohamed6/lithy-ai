import { Module } from '@nestjs/common';
import { AntiAbuseService } from './anti-abuse.service';
import { AntiAbuseController } from './anti-abuse.controller';

@Module({
  controllers: [AntiAbuseController],
  providers: [AntiAbuseService],
  exports: [AntiAbuseService],
})
export class AntiAbuseModule {}
