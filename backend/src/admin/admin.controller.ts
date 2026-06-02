import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Admin')
@Controller('api/v1/admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  async getUsers(@Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return this.adminService.getUsers(page, limit);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details' })
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Put('users/:id/role')
  @ApiOperation({ summary: 'Update user role' })
  async updateUserRole(@Param('id') id: string, @Body() body: { role: string }) {
    return this.adminService.updateUserRole(id, body.role);
  }

  @Post('users/:id/disable')
  @ApiOperation({ summary: 'Disable user' })
  async disableUser(@Param('id') id: string) {
    return this.adminService.disableUser(id);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue summary' })
  async getRevenue() {
    return this.adminService.getRevenueSummary();
  }

  @Get('ai-metrics')
  @ApiOperation({ summary: 'Get AI usage metrics' })
  async getAIMetrics() {
    return this.adminService.getAIMetrics();
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get audit logs' })
  async getLogs(@Query('page') page: number = 1, @Query('limit') limit: number = 50) {
    return this.adminService.getAuditLogs(page, limit);
  }

  @Get('feature-flags')
  @ApiOperation({ summary: 'Get feature flags' })
  async getFeatureFlags() {
    return this.adminService.getFeatureFlags();
  }

  @Put('feature-flags/:id')
  @ApiOperation({ summary: 'Toggle feature flag' })
  async toggleFeatureFlag(@Param('id') id: string, @Body() body: { enabled: boolean }) {
    return this.adminService.toggleFeatureFlag(id, body.enabled);
  }

  @Get('content')
  @ApiOperation({ summary: 'Get all blog posts (content alias)' })
  async getContent() {
    return this.adminService.getBlogPosts();
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'Get all subscriptions' })
  async getSubscriptions() {
    return this.adminService.getSubscriptions();
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get analytics overview' })
  async getAnalytics() {
    return this.adminService.getAnalyticsOverview();
  }

  @Get('blog')
  @ApiOperation({ summary: 'Get all blog posts' })
  async getBlogPosts() {
    return this.adminService.getBlogPosts();
  }

  @Post('blog')
  @ApiOperation({ summary: 'Create blog post' })
  async createBlogPost(@Body() body: any) {
    return this.adminService.createBlogPost(body);
  }

  @Put('blog/:id')
  @ApiOperation({ summary: 'Update blog post' })
  async updateBlogPost(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateBlogPost(id, body);
  }

  @Delete('blog/:id')
  @ApiOperation({ summary: 'Delete blog post' })
  async deleteBlogPost(@Param('id') id: string) {
    return this.adminService.deleteBlogPost(id);
  }
}
