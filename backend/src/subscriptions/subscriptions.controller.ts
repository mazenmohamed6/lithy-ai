import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Subscriptions')
@Controller('api/v1/subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get all subscription plans' })
  async getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get('my')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current user subscription' })
  async getMySubscription(@CurrentUser() user: any) {
    return this.subscriptionsService.getUserSubscription(user.id);
  }

  @Get('addons')
  @ApiOperation({ summary: 'Get available add-on packs' })
  async getAddonPacks() {
    return this.subscriptionsService.getAddonPacks();
  }

  @Get('credits')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get usage credits and remaining' })
  async getCredits(@CurrentUser() user: any) {
    return this.subscriptionsService.getUsageCredits(user.id);
  }

  @Post('cancel')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Cancel subscription at period end' })
  async cancel(@CurrentUser() user: any) {
    return this.subscriptionsService.cancelSubscription(user.id);
  }
}
