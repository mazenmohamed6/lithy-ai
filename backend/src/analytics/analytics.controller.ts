import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Analytics')
@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Post('track')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Track user event' })
  async trackEvent(@CurrentUser() user: any, @Body() body: { event: string; properties?: any }) {
    return this.analyticsService.trackEvent(user.id, body.event, body.properties);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get user analytics' })
  async getUserAnalytics(@CurrentUser() user: any) {
    return this.analyticsService.getUserAnalytics(user.id);
  }

  @Get('revenue')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get revenue analytics' })
  async getRevenueAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getRevenueAnalytics(
      new Date(startDate),
      new Date(endDate),
    );
  }
}
