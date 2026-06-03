import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { FixController } from './fix.controller';

@Module({
  controllers: [AdminController, FixController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
