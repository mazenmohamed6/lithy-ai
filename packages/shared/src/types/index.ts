export type UserRole = "USER" | "PRO" | "ADMIN";
export type SubscriptionStatus = "ACTIVE" | "CANCELED" | "PAST_DUE" | "INCOMPLETE" | "TRIALING" | "EXPIRED";
export type AIGenerationType = "RESUME_GENERATION" | "RESUME_IMPROVEMENT" | "COVER_LETTER" | "LINKEDIN_OPTIMIZATION" | "ATS_SCAN" | "JOB_MATCH";
export type AddonType = "AI_GENERATION" | "ATS_SCAN";

export interface UserProfile {
  id: string;
  userId: string;
  fullName?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  jobTitle?: string;
  company?: string;
  bio?: string;
  website?: string;
  avatarUrl?: string;
  skills: string[];
  experienceLevel?: string;
  resumeViews: number;
  resumeDownloads: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  priceEgp: number;
  priceUsd?: number;
  interval: string;
  annualDiscountPct: number;
  features: Record<string, any>;
  isActive: boolean;
  sortOrder: number;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  trialEnd?: string;
  cancelAtPeriodEnd: boolean;
  plan: SubscriptionPlan;
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  sections: ResumeSection[];
  templateId: string;
  isPublic: boolean;
  publicSlug?: string;
  atsScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeSection {
  id: string;
  type: string;
  title: string;
  enabled: boolean;
  content?: string;
  fields?: Record<string, string>;
  items?: any[];
}

export interface ATSScoreResult {
  score: number;
  breakdown: {
    keywords: number;
    format: number;
    sections: number;
    content: number;
    overall: number;
  };
  recommendations: string[];
  missingKeywords: string[];
  strongPoints: string[];
}

export interface JobMatchResult {
  matchPercentage: number;
  gaps: string[];
  recommendations: string[];
  matchedSkills: string[];
  missingSkills: string[];
}

export interface LinkedInOptimization {
  headline: string;
  about: string;
  experience: any[];
  suggestions: string[];
  keywords: string[];
  score: number;
}

export interface UsageStats {
  aiGenerations: number;
  atsScans: number;
  jobMatches: number;
  resumeCount: number;
}

export interface RevenueSummary {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  totalUsers: number;
}
