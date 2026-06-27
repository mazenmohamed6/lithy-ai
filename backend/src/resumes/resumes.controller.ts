import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFile, Res, BadRequestException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ResumesService } from './resumes.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Resumes')
@Controller('api/v1/resumes')
export class ResumesController {
  private readonly logger = new Logger(ResumesController.name);
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
    return this.resumesService.create(user.id, user.email, body);
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

  @Post('upload')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload resume file from device' })
  @ApiConsumes('multipart/form-data')
  async upload(@CurrentUser() user: any, @UploadedFile() file: any) {
    if (!file) throw new BadRequestException('No file uploaded or file too large (max 20MB)');
    return this.resumesService.createFromUpload(user.id, user.email, file);
  }

  @Get(':id/download')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Download resume as HTML' })
  async download(@Param('id') id: string, @CurrentUser() user: any, @Res() res: Response) {
    const html = await this.resumesService.exportHtml(id, user.id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="resume.html"`);
    res.send(html);
  }

  @Get(':id/download-pdf')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Download resume as PDF' })
  async downloadPdf(@Param('id') id: string, @CurrentUser() user: any, @Res() res: Response) {
    const pdf = await this.resumesService.exportPdf(id, user.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="resume.pdf"`);
    res.send(pdf);
  }

  @Post('render-pdf')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Render resume as PDF via Puppeteer' })
  async renderPdf(@Body() body: { resumeId: string }, @CurrentUser() user: any, @Res() res: Response) {
    this.logger.log(`[PDF] resumeId from body: ${body?.resumeId}`);
    if (!body?.resumeId) {
      this.logger.error(`[PDF] resumeId missing in request body`);
      res.status(400).json({ message: 'Resume ID is required' });
      return;
    }
    try {
      this.logger.log(`[PDF] Generating PDF for resume ${body.resumeId}`);
      const pdfBuffer = await this.resumesService.exportPdfWithChrome(body.resumeId, user.id);
      this.logger.log(`[PDF] PDF generated (${pdfBuffer.length} bytes)`);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="resume.pdf"`);
      res.send(pdfBuffer);
    } catch (err) {
      this.logger.error(`[PDF] Controller caught error`);
      this.logger.error(`[PDF]   type: ${err?.constructor?.name}`);
      this.logger.error(`[PDF]   message: ${err?.message}`);
      this.logger.error(`[PDF]   stack: ${err?.stack}`);
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ message: `PDF generation failed: ${msg.substring(0, 200)}` });
    }
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

  @Post('extract-text')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Extract text from file without creating resume' })
  @ApiConsumes('multipart/form-data')
  async extractText(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('No file uploaded or file too large (max 20MB)');
    const text = await this.resumesService.extractFileText(file);
    return { text };
  }
}
