import { Module } from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { ResumesController } from './resumes.controller';
import { AntiAbuseModule } from '../anti-abuse/anti-abuse.module';

@Module({
  imports: [AntiAbuseModule],
  controllers: [ResumesController],
  providers: [ResumesService],
  exports: [ResumesService],
})
export class ResumesModule {}
