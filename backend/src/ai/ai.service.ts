import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../common/prisma.service';
import { AntiAbuseService } from '../anti-abuse/anti-abuse.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI | null = null;
  private readonly model: string;

  private ensureAi() {
    if (!this.openai) throw new BadRequestException('AI service not configured: missing GROQ_API_KEY');
    return this.openai;
  }

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private antiAbuseService: AntiAbuseService,
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });
    }
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

      const completion = await this.ensureAi().chat.completions.create({
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
      const completion = await this.ensureAi().chat.completions.create({
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
      const completion = await this.ensureAi().chat.completions.create({
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

      const parsed = JSON.parse(completion.choices[0].message.content || '{}');
      const content = parsed.coverLetter || completion.choices[0].message.content || '';

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
      const completion = await this.ensureAi().chat.completions.create({
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
            - strongPoints: string[]
            - keywordHeatmap: array of { keyword: string, found: boolean, density: number (0-100), relevance: string (high/medium/low), category: string }
            - keywordGaps: array of { keyword: string, importance: string (critical/important/nice-to-have), suggestedSection: string, whyItMatters: string }`,
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
      const completion = await this.ensureAi().chat.completions.create({
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

  async generateInterviewQuestions(userId: string, userEmail: string, data: {
    resume: any;
    jobTitle: string;
    jobDescription?: string;
    companyName?: string;
    language: 'en' | 'ar';
  }) {
    await this.ensureUserExists(userId, userEmail);
    await this.checkUsageLimit(userId, 'INTERVIEW_QUESTIONS');

    try {
      const languageInstruction = data.language === 'ar'
        ? 'Respond entirely in Arabic. All questions, answers, and guidance must be in Arabic.'
        : 'Respond entirely in English.';

      const systemPrompt = `You are an expert interview coach and career advisor. Generate a personalized interview preparation set.

${languageInstruction}

Return JSON with the following structure:
{
  "technicalQuestions": [
    {
      "question": "string",
      "category": "string (e.g. JavaScript, System Design, etc.)",
      "difficulty": "junior | mid | senior",
      "approach": "string (key points to solve, not full solution)",
      "keyPoints": ["string"]
    }
  ],
  "behavioralQuestions": [
    {
      "question": "string (in STAR format context)",
      "category": "leadership | teamwork | problem-solving | conflict | communication",
      "starFramework": {
        "situation": "string (how to set up the scenario)",
        "task": "string (what needed to be done)",
        "action": "string (what they did)",
        "result": "string (the outcome)"
      }
    }
  ],
  "companySpecificQuestions": []
}

For companySpecificQuestions:
- If companyName is provided, generate 3-5 company-specific questions about culture fit, role expectations, and common hiring focus areas for that company
- If no companyName provided, return an empty array

For behavioral questions, use STAR (Situation, Task, Action, Result) framework guidance.
For technical questions, provide the question, difficulty level, and approach guidance (not full solutions).

Keep all content practical, concise, and interview-ready.`;

      const completion = await this.ensureAi().chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify({
            resume: data.resume,
            jobTitle: data.jobTitle,
            jobDescription: data.jobDescription || '',
            companyName: data.companyName || '',
          })},
        ],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');

      await this.recordUsage(userId, 'INTERVIEW_QUESTIONS', completion.usage);

      return result;
    } catch (error: any) {
      await this.recordFailure(userId, 'INTERVIEW_QUESTIONS', error.message);
      throw new BadRequestException(error.message || 'AI interview questions generation failed');
    }
  }

  async optimizeLinkedIn(userId: string, userEmail: string, data: { profile: any }) {
    await this.ensureUserExists(userId, userEmail);
    await this.checkUsageLimit(userId, 'LINKEDIN_OPTIMIZATION');

    try {
      const completion = await this.ensureAi().chat.completions.create({
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

  async resumeTailor(userId: string, userEmail: string, data: { resume: any; jobDescription: string; companyName?: string; tone?: string }) {
    await this.ensureUserExists(userId, userEmail);
    await this.checkUsageLimit(userId, 'RESUME_TAILOR');

    try {
      const completion = await this.ensureAi().chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert resume tailoring specialist. Adapt the resume to match the job description perfectly.
            Return JSON with:
            - tailoredSections: array of optimized resume sections
            - changes: string[] (list of specific changes made)
            - matchScore: number (0-100 how well the tailored resume matches the job)
            - keywordsAdded: string[]
            - suggestions: string[] (additional tips for the interview)`,
          },
          { role: 'user', content: JSON.stringify(data) },
        ],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');

      await this.recordUsage(userId, 'RESUME_TAILOR', completion.usage);

      return result;
    } catch (error: any) {
      await this.recordFailure(userId, 'RESUME_TAILOR', error.message);
      throw new BadRequestException(error.message || 'AI resume tailoring failed');
    }
  }

  async resumeReview(userId: string, userEmail: string, data: { resume: any; experienceLevel?: string; industry?: string }) {
    await this.ensureUserExists(userId, userEmail);
    await this.checkUsageLimit(userId, 'RESUME_REVIEW');

    try {
      const completion = await this.ensureAi().chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert resume reviewer and career coach. Provide a detailed resume review.
            Return JSON with:
            - overallScore: number (0-100)
            - sectionScores: { [sectionName: string]: number }
            - strengths: string[]
            - weaknesses: string[]
            - actionableImprovements: string[]
            - formatFeedback: string
            - contentFeedback: string
            - atsReadiness: string`,
          },
          { role: 'user', content: JSON.stringify(data) },
        ],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');

      await this.recordUsage(userId, 'RESUME_REVIEW', completion.usage);

      return result;
    } catch (error: any) {
      await this.recordFailure(userId, 'RESUME_REVIEW', error.message);
      throw new BadRequestException(error.message || 'AI resume review failed');
    }
  }

  async careerAdvisor(userId: string, userEmail: string, data: { currentRole: string; targetRole: string; experience: string; skills: string[]; industry?: string }) {
    await this.ensureUserExists(userId, userEmail);
    await this.checkUsageLimit(userId, 'CAREER_ADVISOR');

    try {
      const completion = await this.ensureAi().chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert career advisor and industry mentor. Provide personalized career guidance.
            Return JSON with:
            - careerPath: string[] (recommended career progression steps)
            - skillGaps: { skill: string; importance: string; howToAcquire: string }[]
            - recommendedRoles: string[]
            - learningResources: { category: string; suggestions: string[] }[]
            - timeline: string (estimated timeline to reach target role)
            - marketInsights: string (relevant industry trends and salary expectations)`,
          },
          { role: 'user', content: JSON.stringify(data) },
        ],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');

      await this.recordUsage(userId, 'CAREER_ADVISOR', completion.usage);

      return result;
    } catch (error: any) {
      await this.recordFailure(userId, 'CAREER_ADVISOR', error.message);
      throw new BadRequestException(error.message || 'AI career advisory failed');
    }
  }

  async portfolioReview(userId: string, userEmail: string, data: { githubUsername?: string; portfolioUrl?: string; description: string; role?: string }) {
    await this.ensureUserExists(userId, userEmail);
    await this.checkUsageLimit(userId, 'PORTFOLIO_REVIEW');

    try {
      const completion = await this.ensureAi().chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert portfolio reviewer and technical recruiter. Evaluate the candidate's portfolio and GitHub presence.
            Return JSON with:
            - overallScore: number (0-100)
            - strengths: string[]
            - improvements: string[]
            - codeQuality?: string (if GitHub provided)
            - projectFeedback: { project: string; score: number; notes: string }[]
            - presentationFeedback: string
            - recommendations: string[]
            - recruiterAppeal: string (how attractive this portfolio is to recruiters)`,
          },
          { role: 'user', content: JSON.stringify(data) },
        ],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');

      await this.recordUsage(userId, 'PORTFOLIO_REVIEW', completion.usage);

      return result;
    } catch (error: any) {
      await this.recordFailure(userId, 'PORTFOLIO_REVIEW', error.message);
      throw new BadRequestException(error.message || 'AI portfolio review failed');
    }
  }

  private async checkUsageLimit(userId: string, type: string) {
    const subscription = await this.prisma.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    const isActive = subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING';
    const effectivePlanId = isActive ? (subscription?.planId || 'plan_free') : 'plan_free';
    const plan = isActive
      ? subscription.plan
      : await this.prisma.subscriptionPlan.findUnique({ where: { id: effectivePlanId } });

    const features = (plan?.features || '{}') as any;
    const parsed = typeof features === 'string' ? JSON.parse(features) : features;

    const featureMap: Record<string, { key: string; isBool: boolean }> = {
      RESUME_GENERATION: { key: 'aiGenerations', isBool: false },
      RESUME_IMPROVEMENT: { key: 'aiGenerations', isBool: false },
      COVER_LETTER: { key: 'aiGenerations', isBool: false },
      ATS_SCAN: { key: 'atsScans', isBool: false },
      JOB_MATCH: { key: 'jobMatches', isBool: false },
      LINKEDIN_OPTIMIZATION: { key: 'linkedinOptimizer', isBool: true },
      INTERVIEW_QUESTIONS: { key: 'aiGenerations', isBool: false },
      RESUME_TAILOR: { key: 'aiGenerations', isBool: false },
      RESUME_REVIEW: { key: 'aiGenerations', isBool: false },
      CAREER_ADVISOR: { key: 'aiGenerations', isBool: false },
      PORTFOLIO_REVIEW: { key: 'aiGenerations', isBool: false },
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

    const userIds = [userId];
    try {
      const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
      if (profile?.phone) {
        const samePhoneProfiles = await this.prisma.userProfile.findMany({
          where: { phone: profile.phone },
          select: { userId: true },
        });
        for (const p of samePhoneProfiles) {
          if (!userIds.includes(p.userId)) userIds.push(p.userId);
        }
      }
    } catch {
      // If profile lookup fails, fall back to single-user check
    }

    // Check identity ledger first (survives account deletion)
    const identityUsage = await this.antiAbuseService.getIdentityUsage(userId);
    const aiGenTypes = ['RESUME_GENERATION', 'RESUME_IMPROVEMENT', 'COVER_LETTER', 'INTERVIEW_QUESTIONS', 'RESUME_TAILOR', 'RESUME_REVIEW', 'CAREER_ADVISOR', 'PORTFOLIO_REVIEW'];
    if (identityUsage.freePlanExhausted) {
      // Determine which feature type matches
      if (aiGenTypes.includes(type)) {
        if (identityUsage.ledgerTotalAiGenerations >= limit) {
          throw new BadRequestException(`Free plan benefits exhausted. Upgrade to access ${type}.`);
        }
      }
      if (type === 'ATS_SCAN' && identityUsage.ledgerTotalAtsScans >= limit) {
        throw new BadRequestException(`Free plan benefits exhausted. Upgrade to access ATS scans.`);
      }
      if (type === 'JOB_MATCH' && identityUsage.ledgerTotalAtsScans >= limit) {
        throw new BadRequestException(`Free plan benefits exhausted. Upgrade to access job matching.`);
      }
    }

    // Combine ledger usage (from deleted accounts) with current account usage
    const ledgerTotal = aiGenTypes.includes(type)
      ? identityUsage.ledgerTotalAiGenerations
      : type === 'ATS_SCAN' || type === 'JOB_MATCH'
        ? identityUsage.ledgerTotalAtsScans
        : 0;

    const usageCount = await this.prisma.aIGeneration.count({
      where: { userId: { in: userIds }, type: type as any, createdAt: { gte: currentMonth } },
    });

    if (usageCount + ledgerTotal >= limit) {
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
    Keep it concise (3-4 paragraphs). Tailor it to the job description.
    You must respond with a valid JSON object that contains a single key "coverLetter" with the cover letter text as the value.`;
  }
}
