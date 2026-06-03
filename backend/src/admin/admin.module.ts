import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { SeedController } from './seed.controller';

@Module({
  controllers: [AdminController, SeedController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
