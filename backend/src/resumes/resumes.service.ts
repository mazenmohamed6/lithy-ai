import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AntiAbuseService } from '../anti-abuse/anti-abuse.service';
import * as fs from 'fs';
import * as path from 'path';

import mammoth from 'mammoth';
const PDFDocument = require('pdfkit');
const pdfjsLib = require('pdfjs-dist');
let chromium: any;
let puppeteer: any;

@Injectable()
export class ResumesService {
  private readonly logger = new Logger(ResumesService.name);
  private uploadDir: string;
  private readonly premiumTemplates = ['professional', 'creative'];

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

    // Enforce template plan restrictions
    if (data.templateId && this.premiumTemplates.includes(data.templateId)) {
      if (parsed.templates !== 'premium') {
        throw new ForbiddenException('Premium templates require a Pro or Premium plan. Upgrade to access this template.');
      }
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

    // Enforce template plan restrictions
    if (data.templateId && this.premiumTemplates.includes(data.templateId)) {
      const sub = await this.prisma.userSubscription.findUnique({ where: { userId } });
      const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: sub?.planId || 'plan_free' } });
      const features = (plan?.features || '{}') as any;
      const parsed = typeof features === 'string' ? JSON.parse(features) : features;
      if (parsed.templates !== 'premium') {
        throw new ForbiddenException('Premium templates require a Pro or Premium plan. Upgrade to access this template.');
      }
    }

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
    const templateId = resume.templateId || 'default';

    const secHtml = (s: any) => {
      const body = (s: any) => {
        if (s.id === 'summary') return `<p class="res-text-body">${s.content || ''}</p>`;
        if (s.id === 'skills') return `<div class="res-skills">${(s.items || []).map((sk: string) => `<span class="res-skill-tag">${sk}</span>`).join('')}</div>`;
        if (s.items?.length) {
          return s.items.map((i: any) => `
            <div class="res-item">
              <div class="res-item-header"><span class="res-item-title">${i.title || i.degree || i.rank || i.name || ''}</span> <span class="res-item-date">${i.startDate || ''}${i.startDate ? ' – ' : ''}${i.current ? 'Present' : i.endDate || ''}</span></div>
              <div class="res-item-sub">${i.company || i.institution || i.branch || ''}</div>
              ${i.description ? `<p class="res-item-desc">${i.description}</p>` : ''}
              ${i.gpa ? `<p class="res-item-desc">GPA: ${i.gpa}</p>` : ''}
            </div>`).join('');
        }
        return '';
      };
      const heading = (() => {
        if (templateId === 'modern') return `<div class="res-sec-header-modern"><span>${s.title}</span></div>`;
        if (templateId === 'creative') return `<div class="res-sec-header-creative"><span class="res-sec-accent"></span>${s.title}</div>`;
        if (templateId === 'professional') return `<div class="res-sec-header-prof"><span class="res-sec-prof-text">${s.title}</span><span class="res-sec-prof-line"></span></div>`;
        if (templateId === 'minimal') return `<div class="res-sec-header-min">${s.title}</div>`;
        return `<div class="res-sec-header-classic"><span class="res-sec-classic-text">${s.title}</span></div>`;
      })();
      return `<section>${heading}${body(s)}</section>`;
    };

    const sectionHtml = (resume.sections as any[])
      .filter((s) => s.id !== 'contact' && s.enabled !== false)
      .map(secHtml).join('');

    const items = [contact.email, contact.phone, contact.location].filter(Boolean);

    let css = '';
    let headerHtml = '';

    if (templateId === 'modern') {
      css = `
.res-root{max-width:800px;margin:40px auto;padding:20px;font-family:'Inter',system-ui,-apple-system,sans-serif;color:#1e293b;line-height:1.5}
.res-contact{background:#f1f5f9;border-radius:10px;padding:20px 24px;margin-bottom:20px}
.res-name{font-size:22px;font-weight:700;color:#0f172a;margin:0 0 8px}
.res-contact-grid{display:flex;flex-wrap:wrap;gap:6px}
.res-contact-chip{font-size:12px;color:#475569;background:#fff;padding:4px 12px;border-radius:20px}
.res-sec-header-modern{margin:18px 0 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#3b82f6}
.res-item{margin-bottom:12px;padding-left:14px;border-left:2px solid #e2e8f0}
.res-item-header{display:flex;justify-content:space-between;align-items:baseline}
.res-item-title{font-size:14px;font-weight:600;color:#0f172a}
.res-item-date{font-size:11px;color:#94a3b8}
.res-item-sub{font-size:12px;color:#3b82f6;font-weight:500;margin-bottom:2px}
.res-item-desc{font-size:12px;color:#475569;margin:2px 0 0;line-height:1.5}
.res-text-body{font-size:12px;color:#475569;line-height:1.6}
.res-skills{display:flex;flex-wrap:wrap;gap:6px}
.res-skill-tag{font-size:11px;color:#1e293b;background:#eef2ff;padding:4px 12px;border-radius:6px;font-weight:500}`;
      headerHtml = `<div class="res-contact res-root" style="margin-top:0"><h1 class="res-name">${contact.fullName || resume.title}</h1><div class="res-contact-grid">${items.map((i) => `<span class="res-contact-chip">${i}</span>`).join('')}</div></div>`;
    } else if (templateId === 'minimal') {
      css = `
.res-root{max-width:800px;margin:40px auto;padding:20px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#333;line-height:1.5}
.res-header-minimal{text-align:center;margin-bottom:24px}
.res-name{font-size:30px;font-weight:200;letter-spacing:3px;color:#111;margin:0 0 6px;text-transform:uppercase}
.res-contact-bar{font-size:10px;color:#999;letter-spacing:1px;margin:0}
.res-sec-header-min{font-size:13px;font-weight:300;text-transform:uppercase;letter-spacing:3px;color:#888;margin:20px 0 10px;padding-top:12px;border-top:1px solid #eee}
.res-item{margin-bottom:10px}
.res-item-header{display:flex;justify-content:space-between;align-items:baseline}
.res-item-title{font-size:13px;font-weight:500;color:#111}
.res-item-date{font-size:10px;color:#aaa}
.res-item-sub{font-size:11px;color:#666;margin-bottom:1px}
.res-item-desc{font-size:11px;color:#555;margin:1px 0 0;line-height:1.5}
.res-text-body{font-size:12px;color:#555;line-height:1.7}
.res-skills{display:flex;flex-wrap:wrap;gap:4px}
.res-skill-tag{font-size:10px;color:#666;padding:2px 8px;border:1px solid #eee;letter-spacing:.5px}`;
      headerHtml = `<div class="res-root" style="margin-top:0"><div class="res-header-minimal"><h1 class="res-name">${contact.fullName || resume.title}</h1><p class="res-contact-bar">${items.join('  /  ')}</p></div></div>`;
    } else if (templateId === 'professional') {
      css = `
.res-root{max-width:800px;margin:40px auto;padding:20px;font-family:Georgia,'Times New Roman',serif;color:#2c3e50;line-height:1.5}
.res-header-professional{text-align:center;margin-bottom:20px;padding:0 40px}
.res-prof-rule-top{width:100%;height:2px;background:#1e3a5f;margin-bottom:12px}
.res-name{font-size:28px;font-weight:700;color:#1e3a5f;letter-spacing:2px;margin:0 0 4px;text-transform:uppercase}
.res-contact-bar{font-size:11px;color:#5a6b7d;letter-spacing:.5px;margin:0 0 10px}
.res-prof-rule-bottom{width:80px;height:1px;background:#c9952c;margin:0 auto}
.res-sec-header-prof{display:flex;align-items:center;gap:12px;margin:18px 0 10px}
.res-sec-prof-text{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#1e3a5f;white-space:nowrap}
.res-sec-prof-line{flex:1;height:1px;background:#1e3a5f}
.res-item{margin-bottom:12px}
.res-item-header{display:flex;justify-content:space-between;align-items:baseline}
.res-item-title{font-size:14px;font-weight:700;color:#1e3a5f}
.res-item-date{font-size:11px;color:#7f8c8d}
.res-item-sub{font-size:12px;font-weight:600;color:#c9952c;margin-bottom:2px}
.res-item-desc{font-size:12px;color:#444;margin:2px 0 0;line-height:1.5}
.res-text-body{font-size:12px;color:#444;line-height:1.6}
.res-skills{display:flex;flex-wrap:wrap;gap:6px}
.res-skill-tag{font-size:11px;color:#2c3e50;background:#edf2f7;padding:3px 10px}`;
      headerHtml = `<div class="res-root" style="margin-top:0"><div class="res-header-professional"><div class="res-prof-rule-top"></div><h1 class="res-name">${contact.fullName || resume.title}</h1><p class="res-contact-bar">${items.join('  |  ')}</p><div class="res-prof-rule-bottom"></div></div></div>`;
    } else if (templateId === 'creative') {
      css = `
.res-root{max-width:800px;margin:40px auto;padding:20px;font-family:'Inter',system-ui,-apple-system,sans-serif;color:#18181b;line-height:1.5}
.res-header-creative{background:linear-gradient(135deg,#f43f5e 0%,#fb7185 50%,#e11d48 100%);color:#fff;padding:28px 32px;border-radius:6px;margin-bottom:20px;text-align:center}
.res-name{font-size:26px;font-weight:800;color:#fff;margin:0 0 4px;letter-spacing:-.5px}
.res-contact-bar{font-size:12px;color:rgba(255,255,255,.9);letter-spacing:.3px;margin:0}
.res-sec-header-creative{display:flex;align-items:center;gap:10px;margin:20px 0 10px;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#18181b}
.res-sec-accent{width:4px;height:18px;background:#f43f5e;border-radius:2px;display:inline-block}
.res-item{margin-bottom:10px;background:#fafafa;padding:12px 14px;border-radius:6px;border-left:3px solid #f43f5e}
.res-item-header{display:flex;justify-content:space-between;align-items:baseline}
.res-item-title{font-size:14px;font-weight:600;color:#18181b}
.res-item-date{font-size:11px;color:#71717a}
.res-item-sub{font-size:12px;color:#f43f5e;font-weight:500;margin-bottom:2px}
.res-item-desc{font-size:12px;color:#52525b;margin:2px 0 0;line-height:1.5}
.res-text-body{font-size:12px;color:#52525b;line-height:1.6}
.res-skills{display:flex;flex-wrap:wrap;gap:6px}
.res-skill-tag{font-size:11px;color:#18181b;background:#fce7f3;padding:4px 12px;border-radius:20px;font-weight:500}`;
      headerHtml = `<div class="res-root" style="margin-top:0"><div class="res-header-creative"><h1 class="res-name">${contact.fullName || resume.title}</h1><p class="res-contact-bar">${items.join('  ·  ')}</p></div></div>`;
    } else {
      css = `
.res-root{max-width:800px;margin:40px auto;padding:20px;font-family:Georgia,'Times New Roman',serif;color:#2d2d2d;line-height:1.5}
.res-header-classic{text-align:center;margin-bottom:20px}
.res-name{font-size:26px;font-weight:700;letter-spacing:1px;color:#1a1a1a;margin:0 0 4px}
.res-contact-bar{font-size:11px;color:#666;letter-spacing:.5px;margin:0 0 10px}
.res-classic-rule{height:0;border-top:2px solid #c9952c;width:60px;margin:0 auto}
.res-sec-header-classic{margin:16px 0 10px;text-align:center;border-top:1px solid #ddd;line-height:0}
.res-sec-classic-text{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#c9952c;background:#fff;padding:0 12px}
.res-item{margin-bottom:12px}
.res-item-header{display:flex;justify-content:space-between;align-items:baseline}
.res-item-title{font-size:14px;font-weight:700;color:#1a1a1a}
.res-item-date{font-size:11px;color:#888;font-style:italic}
.res-item-sub{font-size:12px;font-weight:600;color:#c9952c;margin-bottom:2px}
.res-item-desc{font-size:12px;color:#444;margin:2px 0 0;line-height:1.5}
.res-text-body{font-size:12px;color:#444;line-height:1.6}
.res-skills{display:flex;flex-wrap:wrap;gap:6px}
.res-skill-tag{font-size:11px;color:#555;background:#f5f2eb;padding:3px 10px;border-radius:2px}`;
      headerHtml = `<div class="res-root" style="margin-top:0"><div class="res-header-classic"><h1 class="res-name">${contact.fullName || resume.title}</h1><p class="res-contact-bar">${items.join('  |  ')}</p><div class="res-classic-rule"></div></div></div>`;
    }

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${resume.title}</title>
<style>${css}</style></head><body>
  ${headerHtml}
  <div class="res-root">${sectionHtml}</div>
</body></html>`;
  }

  async exportPdf(id: string, userId: string): Promise<Buffer> {
    try {
      return await this.exportPdfWithChrome(id, userId);
    } catch (err) {
      this.logger.warn(`Chromium PDF failed, falling back to PDFKit: ${err}`);
      return this.exportPdfWithPdfkit(id, userId);
    }
  }

  private async exportPdfWithChrome(id: string, userId: string): Promise<Buffer> {
    if (!puppeteer) {
      const [puppeteerModule, chromiumModule] = await Promise.all([
        import('puppeteer-core') as any,
        import('@sparticuz/chromium') as any,
      ]);
      puppeteer = puppeteerModule.default || puppeteerModule;
      chromium = chromiumModule.default || chromiumModule;
    }
    const html = await this.exportHtml(id, userId);
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 800, height: 1100 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'Letter',
        printBackground: true,
        margin: { top: '0.6in', bottom: '0.6in', left: '0.6in', right: '0.6in' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private async exportPdfWithPdfkit(id: string, userId: string): Promise<Buffer> {
    const resume = await this.findById(id, userId);
    const sections = resume.sections as any[];
    const contact = sections.find((s) => s.id === 'contact')?.fields || {};
    const templateId = resume.templateId || 'default';

    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));

    const ml = doc.page.margins.left;
    const pw = doc.page.width - ml - doc.page.margins.right;

    /*** HEADER ***/
    if (templateId === 'classic' || templateId === 'default') {
      doc.fontSize(24).font('Helvetica-Bold').fillColor('#1a1a1a')
        .text(contact.fullName || resume.title, ml, doc.y, { align: 'center' });
      const cl = [contact.email, contact.phone, contact.location].filter(Boolean).join('  |  ');
      if (cl) doc.fontSize(10).font('Helvetica').fillColor('#555').text(cl, { align: 'center' });
      doc.moveDown(0.3);
      const y1 = doc.y; doc.moveTo(ml, y1).lineTo(ml + pw, y1).strokeColor('#ddd').lineWidth(1).stroke();
      doc.moveDown(0.5);
    } else if (templateId === 'modern') {
      doc.fontSize(20).font('Helvetica-Bold').fillColor('#0f172a')
        .text(contact.fullName || resume.title, ml, doc.y, { align: 'left' });
      const contactGrid: string[] = [];
      if (contact.email) contactGrid.push(contact.email);
      if (contact.phone) contactGrid.push(contact.phone);
      if (contact.location) contactGrid.push(contact.location);
      if (contactGrid.length) {
        doc.fontSize(9).font('Helvetica').fillColor('#475569');
        const startY = doc.y + 4;
        contactGrid.forEach((item, i) => {
          doc.text(item, ml + (i % 2) * (pw / 2), startY + Math.floor(i / 2) * 12);
        });
        doc.y = startY + Math.ceil(contactGrid.length / 2) * 12 + 4;
      }
      doc.moveDown(0.5);
    } else if (templateId === 'minimal') {
      doc.fontSize(28).font('Helvetica').fillColor('#111')
        .text(contact.fullName || resume.title, ml, doc.y, { align: 'center' });
      const cl = [contact.email, contact.phone, contact.location].filter(Boolean).join('  |  ');
      if (cl) doc.fontSize(9.5).font('Helvetica').fillColor('#888').text(cl, { align: 'center' });
      doc.moveDown(0.3);
      const y3 = doc.y; doc.moveTo(ml + 60, y3).lineTo(ml + pw - 60, y3).strokeColor('#ccc').lineWidth(0.5).stroke();
      doc.moveDown(0.5);
    } else if (templateId === 'professional') {
      const nameStr = (contact.fullName || resume.title).toUpperCase();
      doc.fontSize(26).font('Helvetica-Bold').fillColor('#1a365d')
        .text(nameStr, ml, doc.y, { align: 'center' });
      doc.moveDown(0.1);
      const y4 = doc.y;
      doc.moveTo(ml + 100, y4).lineTo(ml + pw - 100, y4).strokeColor('#1a365d').lineWidth(2).stroke();
      doc.moveDown(0.15);
      doc.moveTo(ml + 100, doc.y).lineTo(ml + pw - 100, doc.y).strokeColor('#1a365d').lineWidth(1).stroke();
      doc.moveDown(0.3);
      const cl = [contact.email, contact.phone, contact.location].filter(Boolean).join('  |  ');
      if (cl) doc.fontSize(9.5).font('Helvetica').fillColor('#2d3748').text(cl, { align: 'center' });
      doc.moveDown(0.5);
    } else if (templateId === 'creative') {
      doc.rect(0, 0, doc.page.width, 95).fillColor('#667eea').fill();
      doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold')
        .text(contact.fullName || resume.title, ml, 28, { align: 'center' });
      const cl = [contact.email, contact.phone, contact.location].filter(Boolean).join('  |  ');
      if (cl) doc.fontSize(10).font('Helvetica').fillColor('#ffffff').text(cl, ml, 60, { align: 'center' });
      doc.y = 110;
    }

    /*** SECTIONS ***/
    sections.filter((s) => s.id !== 'contact' && s.enabled !== false).forEach((section) => {
      let secFontSize: number, secFont: string, secColor: string, hasUnderline: boolean, underlineW: number;
      if (templateId === 'modern') {
        secFontSize = 10; secFont = 'Helvetica-Bold'; secColor = '#64748b'; hasUnderline = false; underlineW = 0;
      } else if (templateId === 'minimal') {
        secFontSize = 13; secFont = 'Helvetica'; secColor = '#444'; hasUnderline = true; underlineW = 0.5;
      } else if (templateId === 'professional') {
        secFontSize = 14; secFont = 'Helvetica-Bold'; secColor = '#1a365d'; hasUnderline = true; underlineW = 1.5;
      } else if (templateId === 'creative') {
        secFontSize = 11; secFont = 'Helvetica-Bold'; secColor = '#667eea'; hasUnderline = false; underlineW = 0;
      } else {
        secFontSize = 14; secFont = 'Helvetica-Bold'; secColor = '#1a1a1a'; hasUnderline = true; underlineW = 1;
      }

      doc.moveDown(0.4);
      doc.fontSize(secFontSize).font(secFont).fillColor(secColor)
        .text(section.title, ml, doc.y, { continued: false });

      if (hasUnderline) {
        doc.moveDown(0.1);
        const y = doc.y;
        if (templateId === 'minimal') {
          doc.moveTo(ml, y).lineTo(ml + pw, y).strokeColor('#ddd').lineWidth(underlineW).stroke();
        } else if (templateId === 'professional') {
          doc.moveTo(ml, y).lineTo(ml + pw, y).strokeColor('#1a365d').lineWidth(underlineW).stroke();
        } else {
          doc.moveTo(ml, y).lineTo(ml + pw, y).strokeColor('#333').lineWidth(underlineW).stroke();
        }
      }

      if (templateId === 'modern') {
        doc.moveDown(0.2);
        (section as any)._modernStartY = doc.y;
        (section as any)._modernItemBorderX = ml + 6;
      }

      doc.moveDown(0.3);

      if (section.id === 'summary') {
        if (section.content) {
          const textX = templateId === 'modern' ? ml + 14 : ml;
          doc.fontSize(10).font('Helvetica').fillColor('#333')
            .text(section.content, textX, doc.y, { align: 'left', width: pw - (templateId === 'modern' ? 14 : 0) });
        }
      } else if (section.id === 'skills') {
        if (section.items?.length) {
          const textX = templateId === 'modern' ? ml + 14 : ml;
          const skills = section.items.join('  •  ');
          doc.fontSize(10).font('Helvetica').fillColor('#333')
            .text(skills, textX, doc.y, { align: 'left', width: pw - (templateId === 'modern' ? 14 : 0) });
        }
      } else if (section.items?.length) {
        section.items.forEach((item: any) => {
          const textX = templateId === 'modern' ? ml + 14 : ml;
          const itemWidth = pw - (templateId === 'modern' ? 14 : 0);
          const itemStartY = doc.y;

          if (templateId === 'creative') {
            doc.rect(textX - 4, itemStartY - 2, itemWidth + 8, 1000).fillColor('#fafafa').fill();
          }

          const dateStr = [item.startDate, item.current ? 'Present' : item.endDate].filter(Boolean).join(' - ');

          doc.fontSize(10).font('Helvetica-Bold').fillColor('#111')
            .text(item.title || item.degree || item.rank || '', textX, doc.y, { continued: true, width: itemWidth });
          if (dateStr) {
            const titleW = doc.widthOfString(item.title || item.degree || item.rank || '');
            doc.fontSize(9).font('Helvetica').fillColor('#888')
              .text(dateStr, textX + Math.min(titleW + 10, itemWidth - 80), doc.y, { width: itemWidth - Math.min(titleW + 10, itemWidth - 80), align: 'right' });
          }
          doc.moveDown(0.1);

          const subtitle = item.company || item.institution || item.branch || '';
          if (subtitle) {
            doc.fontSize(9.5).font('Helvetica').fillColor(templateId === 'professional' ? '#1a365d' : '#555')
              .text(subtitle, textX, doc.y, { width: itemWidth });
            doc.moveDown(0.05);
          }

          if (item.description) {
            doc.fontSize(9).font('Helvetica').fillColor('#444')
              .text(item.description, textX, doc.y, { width: itemWidth });
            doc.moveDown(0.2);
          }

          if (templateId === 'creative') {
            const fillH = doc.y - itemStartY + 4;
            doc.rect(textX - 4, itemStartY - 2, itemWidth + 8, fillH).fillColor('#fafafa').fill();
            doc.fillColor('#111');
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#111')
              .text(item.title || item.degree || item.rank || '', textX, itemStartY, { width: itemWidth });
            if (dateStr) {
              doc.fontSize(9).font('Helvetica').fillColor('#888')
                .text(dateStr, textX, doc.y - 20, { width: itemWidth, align: 'right' });
            }
            if (subtitle) {
              doc.fontSize(9.5).font('Helvetica').fillColor('#555').text(subtitle, textX, doc.y, { width: itemWidth });
            }
            if (item.description) {
              doc.fontSize(9).font('Helvetica').fillColor('#444').text(item.description, textX, doc.y, { width: itemWidth });
            }
            doc.moveDown(0.15);
            doc.rect(textX - 4, itemStartY, 3, doc.y - itemStartY).fillColor('#667eea').fill();
          }

          if (templateId === 'modern') {
            doc.moveDown(0.05);
            const y = doc.y;
            doc.moveTo(textX, y).lineTo(textX + itemWidth, y).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
            doc.moveDown(0.1);
          }
        });

        if (templateId === 'modern') {
          const modStartY = (section as any)._modernStartY;
          const modBorderX = (section as any)._modernItemBorderX;
          if (modStartY) {
            doc.lineWidth(2).strokeColor('#e2e8f0');
            doc.moveTo(modBorderX - 2, modStartY).lineTo(modBorderX - 2, doc.y).stroke();
          }
        }
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
      { id: 'certifications', type: 'certifications', title: 'Certifications', enabled: true, items: [] },
      { id: 'languages', type: 'languages', title: 'Languages', enabled: true, items: [] },
      { id: 'projects', type: 'projects', title: 'Projects', enabled: true, items: [] },
      { id: 'military', type: 'military', title: 'Military Service', enabled: true, items: [] },
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
