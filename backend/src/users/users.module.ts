import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AntiAbuseModule } from '../anti-abuse/anti-abuse.module';

@Module({
  imports: [AntiAbuseModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
