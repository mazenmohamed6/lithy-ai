import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AntiAbuseService } from '../anti-abuse/anti-abuse.service';
import * as fs from 'fs';
import * as path from 'path';

import mammoth from 'mammoth';
const PDFDocument = require('pdfkit');
const pdfjsLib = require('pdfjs-dist');

@Injectable()
export class ResumesService {
  private readonly logger = new Logger(ResumesService.name);
  private uploadDir: string;

  constructor(
    private prisma: PrismaService,
    private antiAbuseService: AntiAbuseService,
  ) {
    this.uploadDir = process.env.VERCEL ? '/tmp/uploads' : path.join(process.cwd(), 'uploads');
    try { if (!fs.existsSync(this.uploadDir)) fs.mkdirSync(this.uploadDir, { recursive: true }); } catch {}
  }

  private async ensureUserExists(userId: string, email?: string) {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (existing) return;

    if (email) {
      const existingByEmail = await this.prisma.user.findUnique({ where: { email } });
      if (existingByEmail) {
        await this.prisma.user.delete({ where: { id: existingByEmail.id } });
        this.logger.warn(`Removed stale Prisma user ${existingByEmail.id} (email conflict with ${userId})`);
      }
    }

    await this.prisma.user.create({
      data: { id: userId, email: email || `${userId}@lithy.ai` },
    });

    const freePlan = await this.prisma.subscriptionPlan.findFirst({
      where: { name: 'FREE', isActive: true },
    });

    await this.prisma.userSubscription.create({
      data: {
        userId,
        planId: freePlan?.id || 'plan_free',
        status: 'ACTIVE',
      },
    });

    this.logger.warn(`Auto-created missing Prisma user: ${userId}`);
  }

  async findAll(userId: string) {
    return this.prisma.resume.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { versions: true, exports: true } } },
    });
  }

  async findById(id: string, userId: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { id },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 }, exports: true },
    });

    if (!resume) throw new NotFoundException('Resume not found');
    if (resume.userId !== userId && !resume.isPublic) {
      throw new ForbiddenException('Access denied');
    }

    return resume;
  }

  async findBySlug(slug: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { publicSlug: slug, isPublic: true },
    });

    if (!resume) throw new NotFoundException('Resume not found');

    await this.prisma.userProfile.updateMany({
      where: { userId: resume.userId },
      data: { resumeViews: { increment: 1 } },
    });

    return resume;
  }

  async create(userId: string, userEmail: string, data: { title?: string; templateId?: string }) {
    await this.ensureUserExists(userId, userEmail);

    // Count resumes across all linked accounts in the identity ledger
    const ledgerUserIds = await this.getLedgerUserIds(userId);
    const resumeCount = await this.prisma.resume.count({ where: { userId: { in: ledgerUserIds } } });

    const subscription = await this.prisma.userSubscription.findUnique({ where: { userId } });
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: subscription?.planId || 'plan_free' } });

    const features = (plan?.features || '{}') as any;
    const parsed = typeof features === 'string' ? JSON.parse(features) : features;
    const maxResumes = parsed.maxResumes ?? 3;
    if (maxResumes !== -1 && resumeCount >= maxResumes) {
      throw new ForbiddenException('Resume limit reached. Upgrade your plan.');
    }

    const resume = await this.prisma.resume.create({
      data: {
        userId,
        title: data.title || 'Untitled Resume',
        templateId: data.templateId || 'default',
        sections: this.getDefaultSections(),
      },
    });

    await this.prisma.resumeVersion.create({
      data: {
        resumeId: resume.id,
        sections: resume.sections as any,
        versionNumber: 1,
      },
    });

    return resume;
  }

  async update(id: string, userId: string, data: any) {
    const resume = await this.findById(id, userId);
    if (resume.userId !== userId) throw new ForbiddenException('Access denied');

    const updated = await this.prisma.resume.update({
      where: { id },
      data: {
        ...data,
        sections: data.sections || resume.sections,
      },
    });

    if (data.sections) {
      const latestVersion = await this.prisma.resumeVersion.findFirst({
        where: { resumeId: id },
        orderBy: { versionNumber: 'desc' },
      });

      await this.prisma.resumeVersion.create({
        data: {
          resumeId: id,
          sections: data.sections as any,
          versionNumber: (latestVersion?.versionNumber || 0) + 1,
        },
      });
    }

    return updated;
  }

  async delete(id: string, userId: string) {
    const resume = await this.findById(id, userId);
    if (resume.userId !== userId) throw new ForbiddenException('Access denied');

    await this.prisma.resume.delete({ where: { id } });
    return { message: 'Resume deleted' };
  }

  private async extractTextFromFile(file: any): Promise<string> {
    if (!file) throw new BadRequestException('No file provided');

    const ext = path.extname(file.originalname).toLowerCase();

    if (!ext.match(/\.(pdf|docx|doc|txt)$/i)) {
      throw new BadRequestException('Only PDF, DOCX, and TXT files are supported');
    }

    try {
      if (ext === '.txt') {
        return file.buffer.toString('utf-8').trim().substring(0, 25000);
      } else if (ext === '.pdf') {
        const data = new Uint8Array(file.buffer);
        const fontUrl = path.join(__dirname, '..', '..', '..', 'node_modules', 'pdfjs-dist', 'standard_fonts') + '/';
        const doc = await pdfjsLib.getDocument({ data, standardFontDataUrl: fontUrl }).promise;
        const pages: string[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          const text = content.items.map((item: any) => item.str).join(' ');
          pages.push(text);
        }
        await doc.destroy();
        return pages.join('\n\n').trim().substring(0, 25000);
      } else if (ext === '.docx' || ext === '.doc') {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        return (result.value || '').trim().substring(0, 25000);
      }
    } catch (err) {
      this.logger.warn(`Text extraction failed for ${file.originalname}: ${err}`);
    }

    return '';
  }

  async extractFileText(file: any): Promise<string> {
    return this.extractTextFromFile(file);
  }

  async createFromUpload(userId: string, userEmail: string, file: any) {
    const textContent = await this.extractTextFromFile(file);

    await this.ensureUserExists(userId, userEmail);

    // Enforce resume limit across identity ledger
    const ledgerUserIds = await this.getLedgerUserIds(userId);
    const resumeCount = await this.prisma.resume.count({ where: { userId: { in: ledgerUserIds } } });
    const subscription = await this.prisma.userSubscription.findUnique({ where: { userId } });
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: subscription?.planId || 'plan_free' } });
    const features = (plan?.features || '{}') as any;
    const parsed = typeof features === 'string' ? JSON.parse(features) : features;
    const maxResumes = parsed.maxResumes ?? 3;
    if (maxResumes !== -1 && resumeCount >= maxResumes) {
      throw new ForbiddenException('Resume limit reached. Upgrade your plan.');
    }

    const sections = [
      { id: 'contact', type: 'contact', title: 'Contact', enabled: true, fields: { fullName: file.originalname.replace(/\.[^/.]+$/, '') } },
      { id: 'summary', type: 'summary', title: 'Professional Summary', enabled: true, content: textContent },
      { id: 'experience', type: 'experience', title: 'Experience', enabled: true, items: [] },
      { id: 'education', type: 'education', title: 'Education', enabled: true, items: [] },
      { id: 'skills', type: 'skills', title: 'Skills', enabled: true, items: [] },
    ];

    const resume = await this.prisma.resume.create({
      data: { userId, title: file.originalname.replace(/\.[^/.]+$/, ''), sections, templateId: 'default' },
    });

    await this.prisma.resumeVersion.create({
      data: { resumeId: resume.id, sections: sections as any, versionNumber: 1 },
    });

    return resume;
  }

  async exportHtml(id: string, userId: string): Promise<string> {
    const resume = await this.findById(id, userId);
    const contact = (resume.sections as any[]).find((s) => s.id === 'contact')?.fields || {};

    const sectionHtml = (resume.sections as any[])
      .filter((s) => s.id !== 'contact' && s.enabled !== false)
      .map((s) => {
        if (s.id === 'summary') return `<section><h2>${s.title}</h2><p>${s.content || ''}</p></section>`;
        if (s.id === 'skills') return `<section><h2>${s.title}</h2><p>${(s.items || []).join(' • ')}</p></section>`;
        if (s.items?.length) {
          const items = s.items.map((i: any) => `
            <div class="item">
              <div class="item-header"><strong>${i.title || ''}</strong> <span>${i.startDate || ''}${i.startDate ? ' - ' : ''}${i.current ? 'Present' : i.endDate || ''}</span></div>
              <div class="item-sub">${i.company || i.institution || ''}</div>
              <p>${i.description || ''}</p>
            </div>`).join('');
          return `<section><h2>${s.title}</h2>${items}</section>`;
        }
        return '';
      }).join('');

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${resume.title}</title>
<style>
  body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:20px;color:#1a1a1a;line-height:1.6}
  h1{font-size:24px;margin-bottom:4px} .contact{color:#666;font-size:14px;margin-bottom:24px}
  h2{font-size:18px;border-bottom:2px solid #333;padding-bottom:4px;margin-top:24px}
  .item{margin-bottom:16px} .item-header{display:flex;justify-content:space-between;font-size:14px}
  .item-sub{color:#666;font-size:13px} p{font-size:14px;margin:4px 0}
</style></head><body>
  <h1>${contact.fullName || resume.title}</h1>
  <div class="contact">${[contact.email, contact.phone, contact.location].filter(Boolean).join(' | ')}</div>
  ${sectionHtml}
</body></html>`;
  }

  async exportPdf(id: string, userId: string): Promise<Buffer> {
    const resume = await this.findById(id, userId);
    const sections = resume.sections as any[];
    const contact = sections.find((s) => s.id === 'contact')?.fields || {};

    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text(contact.fullName || resume.title, { align: 'center' });
    const contactLine = [contact.email, contact.phone, contact.location].filter(Boolean).join(' | ');
    if (contactLine) {
      doc.fontSize(10).font('Helvetica').fillColor('#555')
        .text(contactLine, { align: 'center' });
    }

    doc.moveDown(0.5);

    sections.filter((s) => s.id !== 'contact' && s.enabled !== false).forEach((section) => {
      // Section title
      doc.moveDown(0.3);
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#111')
        .text(section.title, { continued: false });
      doc.moveDown(0.15);
      // Underline
      const y = doc.y;
      doc.moveTo(doc.page.margins.left, y)
        .lineTo(doc.page.margins.left + pageWidth, y)
        .strokeColor('#333')
        .lineWidth(1)
        .stroke();
      doc.moveDown(0.4);

      if (section.id === 'summary') {
        if (section.content) {
          doc.fontSize(10).font('Helvetica').fillColor('#333')
            .text(section.content, { align: 'left' });
        }
      } else if (section.id === 'skills') {
        if (section.items?.length) {
          const skills = section.items.join('  •  ');
          doc.fontSize(10).font('Helvetica').fillColor('#333')
            .text(skills, { align: 'left' });
        }
      } else if (section.items?.length) {
        section.items.forEach((item: any) => {
          const dateStr = [item.startDate, item.current ? 'Present' : item.endDate].filter(Boolean).join(' - ');
          doc.fontSize(10).font('Helvetica').fillColor('#333')
            .text(item.title || item.degree || '', { continued: true });
          if (dateStr) {
            doc.fontSize(10).font('Helvetica').fillColor('#666')
              .text(`    ${dateStr}`, { align: 'right' });
          } else {
            doc.moveDown(0.2);
          }

          const subtitle = item.company || item.institution || '';
          if (subtitle) {
            doc.fontSize(10).font('Helvetica').fillColor('#555').text(subtitle);
          }

          if (item.description) {
            doc.fontSize(9).font('Helvetica').fillColor('#444').text(item.description);
            doc.moveDown(0.2);
          }
        });
      }
    });

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      doc.end();
    });
  }

  async togglePublic(id: string, userId: string) {
    const resume = await this.findById(id, userId);
    if (resume.userId !== userId) throw new ForbiddenException('Access denied');

    const slug = resume.isPublic ? null : this.generateSlug();
    return this.prisma.resume.update({
      where: { id },
      data: { isPublic: !resume.isPublic, publicSlug: slug },
    });
  }

  async duplicate(id: string, userId: string) {
    const resume = await this.findById(id, userId);
    return this.prisma.resume.create({
      data: {
        userId,
        title: `${resume.title} (Copy)`,
        sections: resume.sections as any,
        templateId: resume.templateId,
      },
    });
  }

  private async getLedgerUserIds(userId: string): Promise<string[]> {
    const userIds = [userId];
    try {
      const link = await this.prisma.linkedAccount.findFirst({ where: { userId } });
      if (link) {
        const siblings = await this.prisma.linkedAccount.findMany({
          where: { ledgerId: link.ledgerId, status: 'ACTIVE', userId: { not: null } },
          select: { userId: true },
        });
        for (const s of siblings) {
          if (s.userId && !userIds.includes(s.userId)) userIds.push(s.userId);
        }
      }
    } catch {}
    return userIds;
  }

  private getDefaultSections() {
    return [
      { id: 'contact', type: 'contact', title: 'Contact', enabled: true, fields: {} },
      { id: 'summary', type: 'summary', title: 'Professional Summary', enabled: true, content: '' },
      { id: 'experience', type: 'experience', title: 'Experience', enabled: true, items: [] },
      { id: 'education', type: 'education', title: 'Education', enabled: true, items: [] },
      { id: 'skills', type: 'skills', title: 'Skills', enabled: true, items: [] },
    ];
  }

  private generateSlug(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let slug = '';
    for (let i = 0; i < 10; i++) {
      slug += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return slug;
  }
}
