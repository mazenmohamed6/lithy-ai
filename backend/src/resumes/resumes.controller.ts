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
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload resume file from device' })
  @ApiConsumes('multipart/form-data')
  async upload(@CurrentUser() user: any, @UploadedFile() file: any) {
    if (!file) throw new BadRequestException('No file uploaded or file too large (max 10MB)');
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
  @ApiOperation({ summary: 'Render resume print page URL to PDF via dedicated PDF service' })
  async renderPdf(@Body() body: { url: string }, @Res() res: Response) {
    const pdfServiceUrl = process.env.PDF_SERVICE_URL;
    if (!pdfServiceUrl) {
      this.logger.error('PDF_SERVICE_URL not set — deploy the PDF service and set this env var');
      res.status(503).json({ message: 'PDF generation is not configured. Please contact support.' });
      return;
    }

    try {
      this.logger.log(`[PDF] Proxying to PDF service: ${pdfServiceUrl}/render-pdf`);
      const response = await fetch(`${pdfServiceUrl.replace(/\/+$/, '')}/render-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: body.url }),
        signal: AbortSignal.timeout(45000),
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        this.logger.error(`[PDF] PDF service returned ${response.status}: ${errBody}`);
        res.status(response.status).json({ message: `PDF service error: ${errBody.substring(0, 200)}` });
        return;
      }

      const pdfBuffer = await response.arrayBuffer();
      this.logger.log(`[PDF] Received PDF (${pdfBuffer.byteLength} bytes)`);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="resume.pdf"`);
      res.send(Buffer.from(pdfBuffer));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[PDF] Proxy failed: ${msg}`);
      res.status(502).json({ message: `PDF service unreachable: ${msg}` });
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
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Extract text from file without creating resume' })
  @ApiConsumes('multipart/form-data')
  async extractText(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('No file uploaded or file too large (max 10MB)');
    const text = await this.resumesService.extractFileText(file);
    return { text };
  }
}
