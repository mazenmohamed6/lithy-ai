import { Module } from '@nestjs/common';
import { JobMatchService } from './job-match.service';
import { JobMatchController } from './job-match.controller';

@Module({
  controllers: [JobMatchController],
  providers: [JobMatchService],
  exports: [JobMatchService],
})
export class JobMatchModule {}
