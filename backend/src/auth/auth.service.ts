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

  async signUp(email: string, password: string, phone?: string, metadata?: Record<string, any>) {
    if (password.length < 8 || password.length > 128) {
      throw new BadRequestException('Password must be between 8 and 128 characters');
    }
    if (!/[a-z]/.test(password)) throw new BadRequestException('Password must contain a lowercase letter');
    if (!/[A-Z]/.test(password)) throw new BadRequestException('Password must contain an uppercase letter');
    if (!/\d/.test(password)) throw new BadRequestException('Password must contain a digit');
    if (!/[^a-zA-Z0-9]/.test(password)) throw new BadRequestException('Password must contain a special character');

    const { data, error } = await this.supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { ...metadata, phone },
    });

    if (error) throw new BadRequestException(error.message);

    const userId = data.user!.id;

    await this.prisma.user.create({
      data: {
        id: userId,
        email: data.user!.email!,
      },
    });

    if (phone) {
      await this.prisma.userProfile.upsert({
        where: { userId },
        create: { userId, phone },
        update: { phone },
      });
    }

    const selectedPlan = metadata?.selectedPlan || 'free';
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: { name: selectedPlan.toUpperCase() as any, isActive: true },
    });
    const planId = plan?.id || 'plan_free';
    const isPaid = selectedPlan !== 'free';

    if (isPaid) {
      await this.prisma.userSubscription.create({
        data: {
          userId,
          planId,
          status: 'INCOMPLETE',
          trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return {
        user: data.user,
        planName: selectedPlan.toUpperCase(),
        requiresPayment: true,
        requiresVerification: true,
        message: 'Account created. Please verify your email and add a payment method to start your trial.',
      };
    }

    await this.prisma.userSubscription.create({
      data: {
        userId,
        planId,
        status: 'ACTIVE',
      },
    });

    return { user: data.user, requiresVerification: true, message: 'Account created. Please check your email to verify your account.' };
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

    const freePlan = await this.prisma.subscriptionPlan.findFirst({
      where: { name: 'FREE', isActive: true },
    });

    await this.prisma.userSubscription.create({
      data: {
        userId,
        planId: freePlan?.id || 'plan_free',
        status: 'ACTIVE',
      },
    });

    return { synced: true, message: 'User created' };
  }
}
