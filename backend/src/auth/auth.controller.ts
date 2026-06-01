import { Controller, Post, Get, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new user' })
  async signUp(@Body() body: { email: string; password: string; metadata?: any }) {
    return this.authService.signUp(body.email, body.password, body.metadata);
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
}
