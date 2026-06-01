import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class CoverLettersService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.coverLetter.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(id: string, userId: string) {
    const letter = await this.prisma.coverLetter.findFirst({ where: { id, userId } });
    if (!letter) throw new NotFoundException('Cover letter not found');
    return letter;
  }

  async create(userId: string, data: any) {
    return this.prisma.coverLetter.create({
      data: { userId, ...data },
    });
  }

  async update(id: string, userId: string, data: any) {
    await this.findById(id, userId);
    return this.prisma.coverLetter.update({ where: { id }, data });
  }

  async delete(id: string, userId: string) {
    await this.findById(id, userId);
    await this.prisma.coverLetter.delete({ where: { id } });
    return { message: 'Cover letter deleted' };
  }
}
