import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('AI')
@Controller('api/v1/ai')
@UseGuards(AuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('generate-resume')
  @ApiOperation({ summary: 'Generate AI resume content' })
  async generateResume(@CurrentUser() user: any, @Body() body: any) {
    return this.aiService.generateResume(user.id, user.email, body);
  }

  @Post('improve-resume')
  @ApiOperation({ summary: 'Improve existing resume content' })
  async improveResume(@CurrentUser() user: any, @Body() body: any) {
    return this.aiService.improveResume(user.id, user.email, body);
  }

  @Post('cover-letter')
  @ApiOperation({ summary: 'Generate AI cover letter' })
  async generateCoverLetter(@CurrentUser() user: any, @Body() body: any) {
    return this.aiService.generateCoverLetter(user.id, user.email, body);
  }

  @Post('analyze-ats')
  @ApiOperation({ summary: 'Analyze resume ATS compatibility' })
  async analyzeATS(@CurrentUser() user: any, @Body() body: any) {
    return this.aiService.analyzeATS(user.id, user.email, body);
  }

  @Post('analyze-job-match')
  @ApiOperation({ summary: 'Analyze resume-job match' })
  async analyzeJobMatch(@CurrentUser() user: any, @Body() body: any) {
    return this.aiService.analyzeJobMatch(user.id, user.email, body);
  }

  @Post('interview-questions')
  @ApiOperation({ summary: 'Generate interview questions' })
  async generateInterviewQuestions(@CurrentUser() user: any, @Body() body: any) {
    return this.aiService.generateInterviewQuestions(user.id, user.email, body);
  }

  @Post('optimize-linkedin')
  @ApiOperation({ summary: 'Optimize LinkedIn profile' })
  async optimizeLinkedIn(@CurrentUser() user: any, @Body() body: any) {
    return this.aiService.optimizeLinkedIn(user.id, user.email, body);
  }

  @Post('resume-tailor')
  @ApiOperation({ summary: 'Tailor resume to job description' })
  async resumeTailor(@CurrentUser() user: any, @Body() body: any) {
    return this.aiService.resumeTailor(user.id, user.email, body);
  }

  @Post('resume-review')
  @ApiOperation({ summary: 'Review resume quality' })
  async resumeReview(@CurrentUser() user: any, @Body() body: any) {
    return this.aiService.resumeReview(user.id, user.email, body);
  }

  @Post('career-advisor')
  @ApiOperation({ summary: 'Get career advice' })
  async careerAdvisor(@CurrentUser() user: any, @Body() body: any) {
    return this.aiService.careerAdvisor(user.id, user.email, body);
  }

  @Post('portfolio-review')
  @ApiOperation({ summary: 'Review portfolio and GitHub' })
  async portfolioReview(@CurrentUser() user: any, @Body() body: any) {
    return this.aiService.portfolioReview(user.id, user.email, body);
  }
}
