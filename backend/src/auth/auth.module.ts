import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PaymentsModule } from '../payments/payments.module';
import { AntiAbuseModule } from '../anti-abuse/anti-abuse.module';

@Module({
  imports: [PaymentsModule, AntiAbuseModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
