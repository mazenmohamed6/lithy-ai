import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AntiAbuseService } from './anti-abuse.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Anti-Abuse')
@Controller('api/v1/admin/abuse')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AntiAbuseController {
  constructor(private antiAbuseService: AntiAbuseService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Abuse monitoring overview dashboard' })
  async getOverview() {
    return this.antiAbuseService.getOverview();
  }

  @Get('ledgers')
  @ApiOperation({ summary: 'List identity ledgers with filtering' })
  async getLedgers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
    @Query('riskLevel') riskLevel?: string,
    @Query('sort') sort?: string,
  ) {
    return this.antiAbuseService.getLedgers(page, limit, search, riskLevel, sort);
  }

  @Get('ledgers/:id')
  @ApiOperation({ summary: 'Get detailed identity ledger info' })
  async getLedgerById(@Param('id') id: string) {
    return this.antiAbuseService.getLedgerById(id);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'List fraud alerts' })
  async getAlerts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
  ) {
    return this.antiAbuseService.getAlerts(page, limit, status, severity);
  }

  @Get('alerts/stats')
  @ApiOperation({ summary: 'Fraud alert statistics' })
  async getAlertStats() {
    return this.antiAbuseService.getAlertStats();
  }

  @Put('alerts/:id/resolve')
  @ApiOperation({ summary: 'Resolve a fraud alert' })
  async resolveAlert(@Param('id') id: string, @Body() body: { resolvedBy: string; status?: string }) {
    return this.antiAbuseService.resolveAlert(id, body.resolvedBy, body.status);
  }

  @Put('ledgers/:id/flag')
  @ApiOperation({ summary: 'Flag an identity ledger' })
  async flagLedger(@Param('id') id: string, @Body() body: { flag: string; value: boolean }) {
    return this.antiAbuseService.flagLedger(id, body.flag, body.value);
  }

  @Get('audit-log')
  @ApiOperation({ summary: 'Get anti-abuse audit events' })
  async getAuditLog(@Query('page') page: number = 1, @Query('limit') limit: number = 50) {
    return this.antiAbuseService.getAuditLog(page, limit);
  }
}
