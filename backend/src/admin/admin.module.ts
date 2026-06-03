import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { CleanupController } from './cleanup.controller';

@Module({
  controllers: [AdminController, CleanupController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
