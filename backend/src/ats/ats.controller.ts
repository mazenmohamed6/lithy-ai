import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AtsService } from './ats.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('ATS')
@Controller('api/v1/ats')
@UseGuards(AuthGuard)
export class AtsController {
  constructor(private atsService: AtsService) {}

  @Get('history')
  @ApiOperation({ summary: 'Get ATS score history' })
  async getHistory(@CurrentUser() user: any) {
    return this.atsService.getScoreHistory(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ATS score details' })
  async getById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.atsService.getScoreById(id, user.id);
  }
}
