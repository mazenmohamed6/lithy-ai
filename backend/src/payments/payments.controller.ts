import { Controller, Post, Get, Body, Param, Req, Headers, UseGuards, RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Payments')
@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('create-checkout')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create Stripe checkout session for subscription' })
  async createCheckout(
    @CurrentUser() user: any,
    @Body() body: { priceId: string; successUrl: string; cancelUrl: string },
  ) {
    return this.paymentsService.createCheckoutSession(user.id, body.priceId, body.successUrl, body.cancelUrl);
  }

  @Post('addon-checkout')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create checkout session for add-on pack' })
  async createAddonCheckout(
    @CurrentUser() user: any,
    @Body() body: { packId: string; successUrl: string; cancelUrl: string },
  ) {
    return this.paymentsService.createAddonCheckoutSession(user.id, body.packId, body.successUrl, body.cancelUrl);
  }

  @Post('customer-portal')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create Stripe customer portal session' })
  async customerPortal(@CurrentUser() user: any, @Body() body: { returnUrl: string }) {
    return this.paymentsService.createCustomerPortalSession(user.id, body.returnUrl);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook handler' })
  async webhook(@Req() req: RawBodyRequest<any>, @Headers('stripe-signature') signature: string) {
    return this.paymentsService.handleWebhook(req.rawBody, signature);
  }
}
