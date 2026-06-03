import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AntiAbuseModule } from '../anti-abuse/anti-abuse.module';

@Module({
  imports: [AntiAbuseModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
