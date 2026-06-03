import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || process.env.SUPABASE_URL || '';
    const anonKey = this.configService.get<string>('SUPABASE_ANON_KEY') || process.env.SUPABASE_ANON_KEY || '';
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    this.supabase = createClient(supabaseUrl, anonKey);
    this.supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  }

  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    const { data, error } = await this.supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (error) throw new BadRequestException(error.message);

    const userId = data.user!.id;

    await this.prisma.user.create({
      data: {
        id: userId,
        email: data.user!.email!,
      },
    });

    const selectedPlan = metadata?.selectedPlan || 'free';
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: { name: selectedPlan.toUpperCase() as any, isActive: true },
    });
    const planId = plan?.id || 'plan_free';
    const isPaid = selectedPlan !== 'free';

    await this.prisma.userSubscription.create({
      data: {
        userId,
        planId,
        status: isPaid ? 'TRIALING' : 'ACTIVE',
        trialEnd: isPaid ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined,
      },
    });

    if (isPaid) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { role: 'PRO' },
      });
    }

    return { user: data.user, message: 'Account created successfully' };
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

    const { error } = await this.supabaseAdmin.auth.admin.updateUserById(user.user.id, {
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
    const { error } = await this.supabaseAdmin.auth.admin.signOut(token);
    if (error) throw new BadRequestException(error.message);
    return { message: 'Session revoked' };
  }

  async deleteAccount(userId: string) {
    const { error } = await this.supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new BadRequestException(error.message);

    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'Account deleted' };
  }

  async syncUser(userId: string, email: string) {
    const exists = await this.prisma.user.findUnique({ where: { id: userId } });
    if (exists) return { synced: false, message: 'User already exists' };

    await this.prisma.user.create({
      data: { id: userId, email },
    });

    return { synced: true, message: 'User created' };
  }
}
