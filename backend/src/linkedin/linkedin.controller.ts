import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LinkedInService } from './linkedin.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('LinkedIn')
@Controller('api/v1/linkedin')
@UseGuards(AuthGuard)
export class LinkedInController {
  constructor(private linkedInService: LinkedInService) {}

  @Get()
  @ApiOperation({ summary: 'Get LinkedIn profile optimization' })
  async getProfile(@CurrentUser() user: any) {
    return this.linkedInService.getProfile(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Save LinkedIn profile optimization' })
  async saveProfile(@CurrentUser() user: any, @Body() body: any) {
    return this.linkedInService.saveProfile(user.id, body);
  }
}
