import { Controller, Post, Get, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentsService } from '../payments/payments.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('Authentication')
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private paymentsService: PaymentsService,
    private configService: ConfigService,
  ) {}

  @Post('signup')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new user' })
  async signUp(@Body() body: { email: string; password: string; phone?: string; metadata?: any }) {
    const result = await this.authService.signUp(body.email, body.password, body.phone, body.metadata);

    if (result.requiresPayment && result.planName) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || process.env.FRONTEND_URL || 'https://lithy-ai.vercel.app';
      const checkout = await this.paymentsService.createCheckoutSessionForPlan(
        result.user.id,
        result.planName,
        `${frontendUrl}/dashboard?checkout=success`,
        `${frontendUrl}/signup?plan=${body.metadata?.selectedPlan || result.planName.toLowerCase()}`,
      );
      return { ...result, checkoutUrl: checkout.url };
    }

    return result;
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Sign in with email and password' })
  async signIn(@Body() body: { email: string; password: string }) {
    return this.authService.signIn(body.email, body.password);
  }

  @Get('oauth/:provider')
  @ApiOperation({ summary: 'Sign in with OAuth provider' })
  async oAuthSignIn(@Param('provider') provider: string) {
    return this.authService.signInWithOAuth(provider);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with token' })
  async verifyEmail(@Body() body: { token: string }) {
    return this.authService.verifyEmail(body.token);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Send password reset email' })
  async resetPassword(@Body() body: { email: string }) {
    return this.authService.resetPassword(body.email);
  }

  @Post('update-password')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update password' })
  async updatePassword(@CurrentUser() user: any, @Body() body: { newPassword: string }) {
    return this.authService.updatePassword(user.accessToken, body.newPassword);
  }

  @Get('session')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current session' })
  async getSession(@CurrentUser() user: any) {
    return { user };
  }

  @Post('revoke-session')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Revoke current session' })
  async revokeSession(@CurrentUser() user: any) {
    return this.authService.revokeSession(user.accessToken);
  }

  @Delete('account')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete user account' })
  async deleteAccount(@CurrentUser() user: any) {
    return this.authService.deleteAccount(user.id);
  }

  @Post('delete-account')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user account (POST alias)' })
  async deleteAccountPost(@CurrentUser() user: any) {
    return this.authService.deleteAccount(user.id);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync OAuth user to local database' })
  async syncUser(@Body() body: { userId: string; email: string; phone?: string; metadata?: Record<string, any> }) {
    return this.authService.syncUser(body.userId, body.email, body.phone, body.metadata);
  }

  @Post('phone/verify')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm phone verification and update identity ledger' })
  async verifyPhone(@CurrentUser() user: any, @Body() body: { phone: string }) {
    return this.authService.verifyPhone(user.id, body.phone);
  }
}
