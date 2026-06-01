import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private supabase: SupabaseClient;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL')!;
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    const { data, error } = await this.supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: metadata,
    });

    if (error) throw new BadRequestException(error.message);

    await this.prisma.user.create({
      data: {
        id: data.user!.id,
        email: data.user!.email!,
      },
    });

    return { user: data.user, message: 'Verification email sent' };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async signInWithOAuth(provider: string) {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: { redirectTo: `${this.configService.get('FRONTEND_URL')}/auth/callback` },
    });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async verifyEmail(token: string) {
    const { data, error } = await this.supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email',
    });

    if (error) throw new BadRequestException(error.message);

    await this.prisma.user.update({
      where: { id: data.user!.id },
      data: { emailVerified: true },
    });

    return { message: 'Email verified successfully' };
  }

  async resetPassword(email: string) {
    const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${this.configService.get('FRONTEND_URL')}/reset-password`,
    });

    if (error) throw new BadRequestException(error.message);
    return { message: 'Password reset email sent' };
  }

  async updatePassword(accessToken: string, newPassword: string) {
    const { data: user, error: userError } = await this.supabase.auth.getUser(accessToken);
    if (userError || !user.user) throw new BadRequestException('Invalid session');

    const { error } = await this.supabase.auth.admin.updateUserById(user.user.id, {
      password: newPassword,
    });

    if (error) throw new BadRequestException(error.message);
    return { message: 'Password updated successfully' };
  }

  async getSession(token: string) {
    const { data, error } = await this.supabase.auth.getUser(token);
    if (error) throw new BadRequestException('Invalid session');
    return data;
  }

  async revokeSession(token: string) {
    const { error } = await this.supabase.auth.admin.signOut(token);
    if (error) throw new BadRequestException(error.message);
    return { message: 'Session revoked' };
  }

  async deleteAccount(userId: string) {
    const { error } = await this.supabase.auth.admin.deleteUser(userId);
    if (error) throw new BadRequestException(error.message);

    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'Account deleted' };
  }
}
