import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY')!, {
      apiVersion: '2025-02-24.acacia',
    });
  }

  async createCheckoutSession(userId: string, priceId: string, successUrl: string, cancelUrl: string, trialDays: number = 7) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const subscription = await this.prisma.userSubscription.findUnique({ where: { userId } });

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId },
      payment_method_collection: 'always',
    };

    if (subscription?.stripeCustomerId) {
      sessionParams.customer = subscription.stripeCustomerId;
      sessionParams.subscription_data = {
        trial_period_days: trialDays,
      };
    } else {
      sessionParams.customer_email = user.email;
      sessionParams.subscription_data = {
        trial_period_days: trialDays,
      };
    }

    const session = await this.stripe.checkout.sessions.create(sessionParams);

    return { url: session.url, sessionId: session.id };
  }

  async createCheckoutSessionForPlan(userId: string, planName: string, successUrl: string, cancelUrl: string) {
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: { name: planName as any, isActive: true },
    });
    if (!plan?.stripePriceId) {
      throw new BadRequestException(`No Stripe price configured for ${planName}`);
    }
    return this.createCheckoutSession(userId, plan.stripePriceId, successUrl, cancelUrl, 7);
  }

  async createAddonCheckoutSession(userId: string, packId: string, successUrl: string, cancelUrl: string) {
    const pack = await this.prisma.addonPack.findUnique({ where: { id: packId } });
    if (!pack) throw new BadRequestException('Add-on pack not found');

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'egp',
          product_data: { name: `${pack.type} Pack - ${pack.credits} Credits` },
          unit_amount: Math.round(pack.priceEgp * 100), // Convert to piastres
        },
        quantity: 1,
      }],
      client_reference_id: userId,
      metadata: { userId, packId },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return { url: session.url, sessionId: session.id };
  }

  async createCustomerPortalSession(userId: string, returnUrl: string) {
    const subscription = await this.prisma.userSubscription.findUnique({ where: { userId } });
    if (!subscription?.stripeCustomerId) {
      throw new BadRequestException('No active subscription');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET')!;

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    if (!userId) return;

    if (session.mode === 'subscription') {
      const stripeSub = await this.stripe.subscriptions.retrieve(session.subscription as string);

      const stripePriceId = stripeSub.items.data[0]?.price?.id;
      const plan = stripePriceId
        ? await this.prisma.subscriptionPlan.findFirst({ where: { stripePriceId } })
        : null;

      const planId = plan?.id || 'plan_pro';
      const planName = plan?.name || 'PRO';

      const status = stripeSub.status === 'trialing' ? 'TRIALING'
        : stripeSub.status === 'active' ? 'ACTIVE'
        : 'ACTIVE';

      await this.prisma.userSubscription.upsert({
        where: { userId },
        create: {
          userId,
          planId,
          status: status as any,
          stripeSubscriptionId: stripeSub.id,
          stripeCustomerId: session.customer as string,
          currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        },
        update: {
          status: status as any,
          planId,
          stripeSubscriptionId: stripeSub.id,
          stripeCustomerId: session.customer as string,
          currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        },
      });

      if (!planName.startsWith('FREE')) {
        await this.updateUserRole(userId, planName);
      }
    } else if (session.mode === 'payment' && session.metadata?.packId) {
      await this.handleAddonPurchase(session);
      await this.prisma.payment.create({
        data: {
          userId,
          stripePaymentId: session.payment_intent as string,
          amount: (session.amount_total || 0) / 100,
          currency: session.currency || 'egp',
          status: 'succeeded',
          description: 'Add-on purchase',
        },
      });
    }
  }

  private async handleAddonPurchase(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const packId = session.metadata?.packId;
    if (!userId || !packId) return;

    await this.prisma.addonPurchase.create({
      data: {
        userId,
        packId,
        stripePaymentId: session.payment_intent as string,
      },
    });
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;
    const subscription = await this.prisma.userSubscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (subscription) {
      const paymentIntent = invoice.payment_intent;
      await this.prisma.payment.create({
        data: {
          userId: subscription.userId,
          stripePaymentId: typeof paymentIntent === 'string' ? paymentIntent : invoice.id,
          stripeInvoiceId: invoice.id,
          amount: invoice.total / 100,
          currency: invoice.currency,
          status: 'succeeded',
          description: 'Subscription renewal',
        },
      });
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;
    const subscription = await this.prisma.userSubscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (subscription) {
      await this.prisma.userSubscription.update({
        where: { stripeSubscriptionId: subscriptionId },
        data: { status: 'PAST_DUE' },
      });
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const userSub = await this.prisma.userSubscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });
    if (!userSub) return;

    const freePlan = await this.prisma.subscriptionPlan.findFirst({ where: { name: 'FREE' as any } });
    const freePlanId = freePlan?.id || 'plan_free';

    await this.prisma.userSubscription.update({
      where: { id: userSub.id },
      data: { status: 'CANCELED', planId: freePlanId },
    });

    await this.prisma.user.update({
      where: { id: userSub.userId },
      data: { role: 'USER' },
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const isCanceledOrPastDue = subscription.status === 'canceled' || subscription.status === 'past_due' || subscription.status === 'incomplete_expired';

    const freePlan = isCanceledOrPastDue
      ? await this.prisma.subscriptionPlan.findFirst({ where: { name: 'FREE' as any } })
      : null;

    const status = subscription.status === 'active' ? 'ACTIVE'
      : subscription.status === 'past_due' ? 'PAST_DUE'
      : subscription.status === 'canceled' ? 'CANCELED'
      : subscription.status === 'trialing' ? 'TRIALING'
      : subscription.status === 'incomplete' ? 'INCOMPLETE'
      : 'EXPIRED';

    const stripePriceId = subscription.items.data[0]?.price?.id;
    const plan = !isCanceledOrPastDue && stripePriceId
      ? await this.prisma.subscriptionPlan.findFirst({ where: { stripePriceId } })
      : null;

    await this.prisma.userSubscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: status as any,
        planId: freePlan?.id || plan?.id || undefined,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    if (plan && !isCanceledOrPastDue) {
      const userSub = await this.prisma.userSubscription.findUnique({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (userSub) {
        await this.updateUserRole(userSub.userId, plan.name);
      }
    } else if (isCanceledOrPastDue) {
      const userSub = await this.prisma.userSubscription.findUnique({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (userSub) {
        await this.prisma.user.update({
          where: { id: userSub.userId },
          data: { role: 'USER' },
        });
      }
    }
  }

  private async updateUserRole(userId: string, planName: string) {
    const isPaid = planName.startsWith('PRO') || planName.startsWith('PREMIUM');
    const role = isPaid ? 'PRO' : 'USER';
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
    });
  }

  async cancelStripeSubscription(stripeSubscriptionId: string) {
    try {
      await this.stripe.subscriptions.update(stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    } catch (err) {
      this.logger.error(`Failed to cancel Stripe subscription ${stripeSubscriptionId}: ${err}`);
    }
  }
}
