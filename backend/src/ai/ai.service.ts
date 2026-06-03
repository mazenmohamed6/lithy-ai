import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI;
  private readonly model: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set. Get a free key at https://console.groq.com');
    }
    this.openai = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });
    this.model = this.configService.get<string>('GROQ_MODEL') || 'llama-3.3-70b-versatile';
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

  async generateResume(userId: string, userEmail: string, data: { sections: any[]; tone?: string; keywords?: string; focusArea?: string }) {
    await this.ensureUserExists(userId, userEmail);
    await this.checkUsageLimit(userId, 'RESUME_GENERATION');

    try {
      const systemPrompt = this.buildResumeSystemPrompt(data.tone, data.keywords, data.focusArea);
      const userPrompt = this.buildResumeUserPrompt(data.sections);

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0].message.content;
      const result = JSON.parse(content || '{}');

      await this.recordUsage(userId, 'RESUME_GENERATION', completion.usage);

      return result;
    } catch (error: any) {
      await this.recordFailure(userId, 'RESUME_GENERATION', error.message);
      throw new BadRequestException(error.message || 'AI generation failed');
    }
  }

  async improveResume(userId: string, userEmail: string, data: { sections: any[]; instructions: string }) {
    await this.ensureUserExists(userId, userEmail);
    await this.checkUsageLimit(userId, 'RESUME_IMPROVEMENT');

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: "You are an expert resume writer. Improve the resume sections based on the user's instructions. Return JSON with improved sections." },
          { role: 'user', content: JSON.stringify({ sections: data.sections, instructions: data.instructions }) },
        ],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');

      await this.recordUsage(userId, 'RESUME_IMPROVEMENT', completion.usage);

      return result;
    } catch (error: any) {
      await this.recordFailure(userId, 'RESUME_IMPROVEMENT', error.message);
      throw new BadRequestException(error.message || 'AI generation failed');
    }
  }

  async generateCoverLetter(userId: string, userEmail: string, data: { resume: any; jobDescription: string; tone?: string; companyName?: string }) {
    await this.ensureUserExists(userId, userEmail);
    await this.checkUsageLimit(userId, 'COVER_LETTER');

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: this.buildCoverLetterSystemPrompt(data.tone) },
          { role: 'user', content: JSON.stringify({
            resume: data.resume,
            jobDescription: data.jobDescription,
            companyName: data.companyName,
          })},
        ],
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0].message.content || '';

      await this.recordUsage(userId, 'COVER_LETTER', completion.usage);

      return { content };
    } catch (error: any) {
      await this.recordFailure(userId, 'COVER_LETTER', error.message);
      throw new BadRequestException(error.message || 'AI generation failed');
    }
  }

  async analyzeATS(userId: string, userEmail: string, data: { resume: any; jobDescription: string }) {
    await this.ensureUserExists(userId, userEmail);
    await this.checkUsageLimit(userId, 'ATS_SCAN');

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an ATS (Applicant Tracking System) expert. Analyze the resume against the job description.
            Return a JSON with:
            - score: number (0-100)
            - breakdown: { keywords: number, format: number, sections: number, content: number, overall: number }
            - recommendations: string[]
            - missingKeywords: string[]
            - strongPoints: string[]`,
          },
          { role: 'user', content: JSON.stringify(data) },
        ],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');

      await this.recordUsage(userId, 'ATS_SCAN', completion.usage);

      return result;
    } catch (error: any) {
      await this.recordFailure(userId, 'ATS_SCAN', error.message);
      throw new BadRequestException(error.message || 'AI analysis failed');
    }
  }

  async analyzeJobMatch(userId: string, userEmail: string, data: { resume: any; jobDescription: string }) {
    await this.ensureUserExists(userId, userEmail);
    await this.checkUsageLimit(userId, 'JOB_MATCH');

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a career match expert. Analyze how well the resume matches the job description.
            Return JSON with:
            - matchPercentage: number
            - gaps: string[]
            - recommendations: string[]
            - matchedSkills: string[]
            - missingSkills: string[]`,
          },
          { role: 'user', content: JSON.stringify(data) },
        ],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');

      await this.recordUsage(userId, 'JOB_MATCH', completion.usage);

      return result;
    } catch (error: any) {
      await this.recordFailure(userId, 'JOB_MATCH', error.message);
      throw new BadRequestException(error.message || 'AI analysis failed');
    }
  }

  async optimizeLinkedIn(userId: string, userEmail: string, data: { profile: any }) {
    await this.ensureUserExists(userId, userEmail);
    await this.checkUsageLimit(userId, 'LINKEDIN_OPTIMIZATION');

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a LinkedIn optimization expert. Analyze the LinkedIn profile and provide optimization suggestions.
            Return JSON with:
            - headline: string (optimized)
            - about: string (optimized summary)
            - experience: array of optimized entries
            - suggestions: string[]
            - keywords: string[]
            - score: number`,
          },
          { role: 'user', content: JSON.stringify(data) },
        ],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');

      await this.recordUsage(userId, 'LINKEDIN_OPTIMIZATION', completion.usage);

      return result;
    } catch (error: any) {
      await this.recordFailure(userId, 'LINKEDIN_OPTIMIZATION', error.message);
      throw new BadRequestException(error.message || 'AI optimization failed');
    }
  }

  private async checkUsageLimit(userId: string, type: string) {
    const subscription = await this.prisma.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    const planId = subscription?.planId || 'plan_free';
    const plan = subscription?.plan || await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });

    const features = (plan?.features || '{}') as any;
    const parsed = typeof features === 'string' ? JSON.parse(features) : features;

    const featureMap: Record<string, { key: string; isBool: boolean }> = {
      RESUME_GENERATION: { key: 'aiGenerations', isBool: false },
      RESUME_IMPROVEMENT: { key: 'aiGenerations', isBool: false },
      COVER_LETTER: { key: 'aiGenerations', isBool: false },
      ATS_SCAN: { key: 'atsScans', isBool: false },
      JOB_MATCH: { key: 'jobMatches', isBool: false },
      LINKEDIN_OPTIMIZATION: { key: 'linkedinOptimizer', isBool: true },
    };

    const feature = featureMap[type];
    if (!feature) return;

    const value = parsed[feature.key];
    if (value === undefined) return;

    if (feature.isBool) {
      if (!value) throw new BadRequestException(`${type} is not available on your current plan. Upgrade to access this feature.`);
      return;
    }

    const limit = value === -1 ? Infinity : value;
    if (limit === Infinity) return;

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const usageCount = await this.prisma.aIGeneration.count({
      where: { userId, type: type as any, createdAt: { gte: currentMonth } },
    });

    if (usageCount >= limit) {
      throw new BadRequestException(`Monthly limit reached for ${type}. Upgrade or purchase add-on pack.`);
    }
  }

  private async recordFailure(userId: string, type: string, errorMessage: string) {
    try {
      await this.prisma.aIGeneration.create({
        data: {
          userId,
          type: type as any,
          promptTokens: 0,
          completionTokens: 0,
          model: this.model,
          costEgp: 0,
          status: 'failed',
          errorMessage,
        },
      });
    } catch (dbError) {
      this.logger.error(`Failed to record AI usage failure: ${dbError}`);
    }
  }

  private async recordUsage(userId: string, type: string, usage: any) {
    try {
      const tokens = usage?.total_tokens || 0;
      const costPerToken = 0.00001;
      const costUsd = tokens * costPerToken;

      await this.prisma.aIGeneration.create({
        data: {
          userId,
          type: type as any,
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          model: this.model,
          costEgp: costUsd * 48,
          status: 'completed',
        },
      });
    } catch (dbError) {
      this.logger.error(`Failed to record AI usage: ${dbError}`);
    }
  }

  private buildResumeSystemPrompt(tone?: string, keywords?: string, focusArea?: string) {
    return `You are an expert resume writer and career coach. Create professional, ATS-optimized resume content.
    Tone: ${tone || 'professional'}
    ${keywords ? `Target keywords: ${keywords}` : ''}
    ${focusArea ? `Focus area: ${focusArea}` : ''}
    Return JSON with improved sections maintaining the same structure but with enhanced content.`;
  }

  private buildResumeUserPrompt(sections: any[]) {
    return JSON.stringify({ sections, instructions: 'Improve the resume content to be more impactful, achievement-oriented, and ATS-friendly. Use strong action verbs and quantify achievements where possible.' });
  }

  private buildCoverLetterSystemPrompt(tone?: string) {
    return `You are an expert cover letter writer. Create a compelling, professional cover letter.
    Tone: ${tone || 'professional'}
    Format: Include date, salutation, body paragraphs, and closing.
    Keep it concise (3-4 paragraphs). Tailor it to the job description.`;
  }
}
