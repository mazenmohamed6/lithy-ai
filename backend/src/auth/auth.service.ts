import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../common/prisma.service';
import { AntiAbuseService } from '../anti-abuse/anti-abuse.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private antiAbuseService: AntiAbuseService,
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

    // Extract anti-abuse signals from metadata
    const deviceFingerprint = metadata?.deviceFingerprint as string | undefined;
    const browserFingerprint = metadata?.browserFingerprint as string | undefined;

    if (phone) {
      const existingPhone = await this.prisma.userProfile.findUnique({ where: { phone } });
      if (existingPhone) {
        throw new BadRequestException('This phone number is already registered with another account. Each phone number can only be used for one account.');
      }
    }

    const existingByEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existingByEmail) {
      await this.prisma.user.delete({ where: { id: existingByEmail.id } });
    }

    const { data, error } = await this.supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { ...metadata, phone },
    });

    if (error) {
      if (error.message?.toLowerCase().includes('already registered')) {
        const { data: users } = await (this.supabaseAdmin.auth.admin.listUsers as any)({ search: email });
        const oldUser = (users?.users as any[])?.find((u: any) => u.email === email);
        if (oldUser) {
          await this.supabaseAdmin.auth.admin.deleteUser(oldUser.id);
          this.logger.log(`Deleted stale Supabase user ${oldUser.id} for email ${email} to allow re-registration`);
        }
      }
      throw new BadRequestException(error.message);
    }

    const userId = data.user!.id;

    // Check identity ledger BEFORE creating local user
    const eligibility = await this.antiAbuseService.checkFreePlanEligibility(userId, {
      email,
      phone,
      deviceFingerprint,
      browserFingerprint,
    });

    await this.prisma.user.create({
      data: {
        id: userId,
        email: data.user!.email!,
      },
    });

    if (phone) {
      await this.prisma.userProfile.create({
        data: { userId, phone },
      });
    }

    // Link this account to the identity ledger
    await this.antiAbuseService.linkAccount(eligibility.ledgerId!, userId, {
      email,
      phone,
      deviceFingerprint,
      browserFingerprint,
    });

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
        },
      });

      return {
        user: data.user,
        planName: selectedPlan.toUpperCase(),
        requiresPayment: true,
        message: 'Account created. Complete payment to activate your plan.',
        isReturningUser: eligibility.isReturningUser,
      };
    }

    await this.prisma.userSubscription.create({
      data: {
        userId,
        planId,
        status: 'ACTIVE',
      },
    });

    // Recalculate risk score
    await this.antiAbuseService.recalculateRiskScore(eligibility.ledgerId!);

    return {
      user: data.user,
      message: eligibility.eligible
        ? eligibility.isReturningUser
          ? `Account created. ${eligibility.previousUsage.totalAiGenerations} AI generations and ${eligibility.previousUsage.totalAtsScans} ATS scans already consumed from previous accounts.`
          : 'Account created successfully!'
        : eligibility.message || 'Account created.',
      isReturningUser: eligibility.isReturningUser,
      freePlanAccessible: eligibility.eligible,
    };
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
    // 1. Back up usage to identity ledger before deletion
    await this.antiAbuseService.backupUsageToLedger(userId);

    // 2. Mark linked account as deleted
    await this.antiAbuseService.markAccountDeleted(userId);

    // 3. Delete from Supabase
    const { error } = await this.supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new BadRequestException(error.message);

    // 4. Delete from Prisma (cascade removes all user data)
    await this.prisma.user.delete({ where: { id: userId } });

    this.logger.log(`Account deleted for user ${userId} — usage preserved in identity ledger`);
    return { message: 'Account deleted. You can create a new account, but previously consumed free credits remain consumed.' };
  }

  async syncUser(userId: string, email: string, phone?: string, metadata?: Record<string, any>) {
    const exists = await this.prisma.user.findUnique({ where: { id: userId } });
    if (exists) return { synced: false, message: 'User already exists' };

    const deviceFingerprint = metadata?.deviceFingerprint as string | undefined;
    const browserFingerprint = metadata?.browserFingerprint as string | undefined;

    if (phone) {
      const existingPhone = await this.prisma.userProfile.findUnique({ where: { phone } });
      if (existingPhone) {
        throw new BadRequestException('This phone number is already registered with another account.');
      }
    }

    const existingByEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existingByEmail) {
      await this.prisma.user.delete({ where: { id: existingByEmail.id } });
    }

    // Check identity ledger
    const eligibility = await this.antiAbuseService.checkFreePlanEligibility(userId, {
      email,
      phone,
      deviceFingerprint,
      browserFingerprint,
    });

    await this.prisma.user.create({
      data: { id: userId, email },
    });

    if (phone) {
      await this.prisma.userProfile.create({
        data: { userId, phone },
      });
    }

    // Link account
    await this.antiAbuseService.linkAccount(eligibility.ledgerId!, userId, {
      email,
      phone,
      deviceFingerprint,
      browserFingerprint,
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

    await this.antiAbuseService.recalculateRiskScore(eligibility.ledgerId!);

    return {
      synced: true,
      message: eligibility.isReturningUser
        ? `Account restored. ${eligibility.previousUsage.totalAiGenerations} AI generations already consumed from previous accounts.`
        : 'User created',
      isReturningUser: eligibility.isReturningUser,
    };
  }

  async verifyPhone(userId: string, phone: string) {
    return this.antiAbuseService.verifyPhone(userId, phone);
  }
}
