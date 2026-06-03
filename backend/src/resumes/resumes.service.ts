import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

import mammoth from 'mammoth';
const pdfParse: any = require('pdf-parse');

@Injectable()
export class ResumesService {
  private uploadDir: string;

  constructor(private prisma: PrismaService) {
    this.uploadDir = process.env.VERCEL ? '/tmp/uploads' : path.join(process.cwd(), 'uploads');
    try { if (!fs.existsSync(this.uploadDir)) fs.mkdirSync(this.uploadDir, { recursive: true }); } catch {}
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

  async create(userId: string, data: { title?: string; templateId?: string }) {
    const resumeCount = await this.prisma.resume.count({ where: { userId } });
    const subscription = await this.prisma.userSubscription.findUnique({ where: { userId } });
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: subscription?.planId || 'plan_free' } });

    const features = (plan?.features || {}) as Record<string, any>;
    const maxResumes = features.maxResumes ?? 3;
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

  async createFromUpload(userId: string, file: any) {
    if (!file) throw new BadRequestException('No file provided');
    if (!file.originalname.match(/\.(pdf|docx|doc|txt)$/i)) {
      throw new BadRequestException('Only PDF, DOCX, and TXT files are supported');
    }

    const ext = path.extname(file.originalname).toLowerCase();
    let textContent = '';

    try {
      if (ext === '.txt') {
        textContent = file.buffer.toString('utf-8');
      } else if (ext === '.pdf') {
        const data = await pdfParse(file.buffer);
        textContent = data.text || '';
      } else if (ext === '.docx' || ext === '.doc') {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        textContent = result.value || '';
      }
    } catch (err) {
      textContent = `[Could not extract text from ${file.originalname}]`;
    }

    textContent = textContent.trim().substring(0, 10000);

    const sections = [
      { id: 'contact', type: 'contact', title: 'Contact', enabled: true, fields: { fullName: file.originalname.replace(/\.[^/.]+$/, '') } },
      { id: 'summary', type: 'summary', title: 'Professional Summary', enabled: true, content: textContent.substring(0, 2000) },
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
