import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JobMatchService } from './job-match.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Job Match')
@Controller('job-match')
@UseGuards(AuthGuard)
export class JobMatchController {
  constructor(private jobMatchService: JobMatchService) {}

  @Get('history')
  @ApiOperation({ summary: 'Get job match history' })
  async getHistory(@CurrentUser() user: any) {
    return this.jobMatchService.getHistory(user.id);
  }
}
