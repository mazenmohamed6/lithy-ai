import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY')!);
  }

  async sendWelcomeEmail(userId: string, email: string, name: string) {
    return this.sendEmail({
      userId,
      to: email,
      subject: 'Welcome to LITHY AI!',
      type: 'welcome',
      html: `
        <h1>Welcome to LITHY AI!</h1>
        <p>Hi ${name},</p>
        <p>Thank you for joining LITHY AI. Create your first AI-powered resume today.</p>
        <p><a href="${this.configService.get('FRONTEND_URL')}/dashboard">Get Started</a></p>
      `,
    });
  }

  async sendPasswordReset(email: string, resetLink: string) {
    return this.sendEmail({
      to: email,
      subject: 'Reset your LITHY AI password',
      type: 'password_reset',
      html: `
        <h1>Reset Your Password</h1>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetLink}">Reset Password</a></p>
        <p>This link expires in 1 hour.</p>
      `,
    });
  }

  async sendSubscriptionConfirmation(userId: string, email: string, planName: string) {
    return this.sendEmail({
      userId,
      to: email,
      subject: `Welcome to LITHY AI ${planName}!`,
      type: 'subscription',
      html: `
        <h1>Subscription Confirmed!</h1>
        <p>You are now on the <strong>${planName}</strong> plan.</p>
        <p>Enjoy unlimited access to all ${planName} features.</p>
      `,
    });
  }

  async sendPaymentFailed(userId: string, email: string) {
    return this.sendEmail({
      userId,
      to: email,
      subject: 'Payment Failed — LITHY AI',
      type: 'payment_failed',
      html: `
        <h1>Payment Failed</h1>
        <p>Your recent payment failed. Please update your payment method to continue using LITHY AI.</p>
        <p><a href="${this.configService.get('FRONTEND_URL')}/billing">Update Payment Method</a></p>
      `,
    });
  }

  async sendRenewalReminder(userId: string, email: string, daysRemaining: number) {
    return this.sendEmail({
      userId,
      to: email,
      subject: `Your LITHY AI subscription renews in ${daysRemaining} days`,
      type: 'renewal_reminder',
      html: `
        <h1>Subscription Renewal</h1>
        <p>Your LITHY AI subscription will renew in ${daysRemaining} days.</p>
      `,
    });
  }

  async sendTrialEnding(userId: string, email: string, daysRemaining: number) {
    return this.sendEmail({
      userId,
      to: email,
      subject: 'Your LITHY AI trial ends soon',
      type: 'trial_ending',
      html: `
        <h1>Trial Ending Soon</h1>
        <p>Your free trial ends in ${daysRemaining} days. Upgrade to keep your resumes.</p>
        <p><a href="${this.configService.get('FRONTEND_URL')}/pricing">Upgrade Now</a></p>
      `,
    });
  }

  private async sendEmail(data: { userId?: string; to: string; subject: string; type: string; html: string }) {
    try {
      const result = await this.resend.emails.send({
        from: 'LITHY AI <noreply@lithyai.com>',
        to: data.to,
        subject: data.subject,
        html: data.html,
      });

      await this.prisma.emailLog.create({
        data: {
          userId: data.userId || '',
          type: data.type,
          recipient: data.to,
          subject: data.subject,
          status: 'sent',
        },
      });

      return result;
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`);

      await this.prisma.emailLog.create({
        data: {
          userId: data.userId || '',
          type: data.type,
          recipient: data.to,
          subject: data.subject,
          status: 'failed',
          error: error.message,
        },
      });

      throw error;
    }
  }
}
