import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResumesService } from './resumes.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Resumes')
@Controller('resumes')
export class ResumesController {
  constructor(private resumesService: ResumesService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get all user resumes' })
  async findAll(@CurrentUser() user: any) {
    return this.resumesService.findAll(user.id);
  }

  @Get('public/:slug')
  @ApiOperation({ summary: 'Get public resume by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.resumesService.findBySlug(slug);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get resume by ID' })
  async findById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.resumesService.findById(id, user.id);
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create new resume' })
  async create(@CurrentUser() user: any, @Body() body: { title?: string; templateId?: string }) {
    return this.resumesService.create(user.id, body);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update resume' })
  async update(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.resumesService.update(id, user.id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete resume' })
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.resumesService.delete(id, user.id);
  }

  @Post(':id/toggle-public')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Toggle resume public visibility' })
  async togglePublic(@Param('id') id: string, @CurrentUser() user: any) {
    return this.resumesService.togglePublic(id, user.id);
  }

  @Post(':id/duplicate')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Duplicate resume' })
  async duplicate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.resumesService.duplicate(id, user.id);
  }
}
