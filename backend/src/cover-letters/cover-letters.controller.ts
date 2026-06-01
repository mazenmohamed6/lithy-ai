import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CoverLettersService } from './cover-letters.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Cover Letters')
@Controller('cover-letters')
@UseGuards(AuthGuard)
export class CoverLettersController {
  constructor(private coverLettersService: CoverLettersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all cover letters' })
  async findAll(@CurrentUser() user: any) {
    return this.coverLettersService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cover letter by ID' })
  async findById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.coverLettersService.findById(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create cover letter' })
  async create(@CurrentUser() user: any, @Body() body: any) {
    return this.coverLettersService.create(user.id, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update cover letter' })
  async update(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.coverLettersService.update(id, user.id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete cover letter' })
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.coverLettersService.delete(id, user.id);
  }
}
