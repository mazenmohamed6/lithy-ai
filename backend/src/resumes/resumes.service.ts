import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ResumesService {
  constructor(private prisma: PrismaService) {}

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
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: subscription?.planId || 'free' } });

    const maxResumes = 10; // Default max; check plan limits
    if (resumeCount >= maxResumes) {
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
