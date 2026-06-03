import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

export interface IdentitySignals {
  email?: string;
  phone?: string;
  deviceFingerprint?: string;
  browserFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  oauthProvider?: string;
  oauthId?: string;
}

export interface EligibilityResult {
  eligible: boolean;
  ledgerId: string | null;
  isReturningUser: boolean;
  previousUsage: {
    totalAiGenerations: number;
    totalAtsScans: number;
    totalResumeExports: number;
    totalCoverLetters: number;
    freePlanExhausted: boolean;
  };
  riskScore: number;
  riskLevel: string;
  message?: string;
}

@Injectable()
export class AntiAbuseService {
  private readonly logger = new Logger(AntiAbuseService.name);

  constructor(private prisma: PrismaService) {}

  // ── Identity Correlation ──────────────────────────────────────────────

  async findOrCreateLedger(signals: IdentitySignals): Promise<{
    ledger: any;
    isReturningUser: boolean;
    wasLinked: boolean;
  }> {
    const { email, phone, deviceFingerprint, browserFingerprint, oauthProvider, oauthId, ipAddress, userAgent } = signals;

    // 1. Search existing ledgers matching ANY signal
    const existingLedgerIds = new Set<string>();
    const signalMatches: Array<{ ledgerId: string; signal: string; weight: number }> = [];

    if (email) {
      const byEmail = await this.prisma.linkedAccount.findMany({
        where: { email: email.toLowerCase().trim() },
        select: { ledgerId: true },
        distinct: ['ledgerId'],
      });
      for (const match of byEmail) {
        const lid = match.ledgerId;
        if (!existingLedgerIds.has(lid)) {
          existingLedgerIds.add(lid);
          signalMatches.push({ ledgerId: lid, signal: 'email', weight: 20 });
        }
      }
    }

    if (oauthId && oauthProvider) {
      const byOAuth = await this.prisma.linkedAccount.findMany({
        where: { oauthProvider, oauthId },
        select: { ledgerId: true },
        distinct: ['ledgerId'],
      });
      for (const match of byOAuth) {
        const lid = match.ledgerId;
        if (!existingLedgerIds.has(lid)) {
          existingLedgerIds.add(lid);
          signalMatches.push({ ledgerId: lid, signal: 'oauth', weight: 20 });
        }
      }
    }

    if (phone) {
      const byPhone = await this.prisma.identityLedger.findMany({
        where: { phone },
        select: { id: true },
      });
      for (const match of byPhone) {
        if (!existingLedgerIds.has(match.id)) {
          existingLedgerIds.add(match.id);
          signalMatches.push({ ledgerId: match.id, signal: 'phone', weight: 15 });
        }
      }
    }

    if (deviceFingerprint) {
      const byDevice = await this.prisma.identityLedger.findMany({
        where: { deviceFingerprint },
        select: { id: true },
      });
      for (const match of byDevice) {
        if (!existingLedgerIds.has(match.id)) {
          existingLedgerIds.add(match.id);
          signalMatches.push({ ledgerId: match.id, signal: 'device', weight: 12 });
        }
      }
    }

    if (browserFingerprint) {
      const byBrowser = await this.prisma.identityLedger.findMany({
        where: { browserFingerprint },
        select: { id: true },
      });
      for (const match of byBrowser) {
        if (!existingLedgerIds.has(match.id)) {
          existingLedgerIds.add(match.id);
          signalMatches.push({ ledgerId: match.id, signal: 'browser', weight: 10 });
        }
      }
    }

    if (ipAddress) {
      const byIp = await this.prisma.linkedAccount.findMany({
        where: { ipAddresses: { array_contains: ipAddress } },
        select: { ledgerId: true },
        distinct: ['ledgerId'],
      });
      for (const match of byIp) {
        if (!existingLedgerIds.has(match.ledgerId)) {
          existingLedgerIds.add(match.ledgerId);
          signalMatches.push({ ledgerId: match.ledgerId, signal: 'ip', weight: 8 });
        }
      }
    }

    if (userAgent) {
      const byUa = await this.prisma.linkedAccount.findMany({
        where: { userAgents: { array_contains: userAgent } },
        select: { ledgerId: true },
        distinct: ['ledgerId'],
      });
      for (const match of byUa) {
        if (!existingLedgerIds.has(match.ledgerId)) {
          existingLedgerIds.add(match.ledgerId);
          signalMatches.push({ ledgerId: match.ledgerId, signal: 'user_agent', weight: 5 });
        }
      }
    }

    // 2. If we found existing ledgers, pick the best match (most signal weight)
    if (signalMatches.length > 0) {
      const grouped = new Map<string, { ledgerId: string; totalWeight: number; signals: string[] }>();
      for (const sm of signalMatches) {
        const existing = grouped.get(sm.ledgerId) || { ledgerId: sm.ledgerId, totalWeight: 0, signals: [] };
        existing.totalWeight += sm.weight;
        existing.signals.push(sm.signal);
        grouped.set(sm.ledgerId, existing);
      }

      const sorted = [...grouped.entries()].sort((a, b) => b[1].totalWeight - a[1].totalWeight);
      const bestMatch = sorted[0][1];

      const ledger = await this.prisma.identityLedger.findUnique({
        where: { id: bestMatch.ledgerId },
      });

      // Log identity linking event
      await this.prisma.riskEvent.create({
        data: {
          ledgerId: bestMatch.ledgerId,
          eventType: 'IDENTITY_LINKED',
          details: {
            matchedSignals: bestMatch.signals,
            totalWeight: bestMatch.totalWeight,
            newSignals: { email, phone, deviceFingerprint, browserFingerprint, oauthProvider, oauthId, ipAddress, userAgent },
          },
        },
      });

      return { ledger, isReturningUser: true, wasLinked: true };
    }

    // 3. No existing ledger found → create new one
    const ledger = await this.prisma.identityLedger.create({
      data: {
        phone,
        deviceFingerprint,
        browserFingerprint,
      },
    });

    await this.prisma.riskEvent.create({
      data: {
        ledgerId: ledger.id,
        eventType: 'ACCOUNT_CREATED',
        details: { signals: { email, phone, deviceFingerprint, browserFingerprint, ipAddress, userAgent } },
      },
    });

    return { ledger, isReturningUser: false, wasLinked: false };
  }

  // ── Linked Account Management ─────────────────────────────────────────

  async linkAccount(ledgerId: string, userId: string, signals: IdentitySignals) {
    const { email, oauthProvider, oauthId, ipAddress, userAgent } = signals;

    // Check if this userId is already linked
    const existing = await this.prisma.linkedAccount.findFirst({
      where: { userId },
    });
    if (existing) return existing;

    const linked = await this.prisma.linkedAccount.create({
      data: {
        ledgerId,
        userId,
        email: email?.toLowerCase().trim(),
        oauthProvider,
        oauthId,
        ipAddresses: ipAddress ? [ipAddress] : [],
        userAgents: userAgent ? [userAgent] : [],
      },
    });

    return linked;
  }

  async markAccountDeleted(userId: string) {
    const link = await this.prisma.linkedAccount.findFirst({
      where: { userId, status: 'ACTIVE' },
    });
    if (!link) return;

    await this.prisma.linkedAccount.update({
      where: { id: link.id },
      data: { status: 'DELETED', deletedAt: new Date() },
    });

    await this.prisma.riskEvent.create({
      data: {
        ledgerId: link.ledgerId,
        eventType: 'ACCOUNT_DELETED',
        details: { userId, email: link.email },
      },
    });

    // Check for rapid creation/deletion pattern
    await this.checkRapidCreationPattern(link.ledgerId, userId);
  }

  private async checkRapidCreationPattern(ledgerId: string, currentUserId: string) {
    const recentDeletedAccounts = await this.prisma.linkedAccount.findMany({
      where: { ledgerId, status: 'DELETED' },
      orderBy: { deletedAt: 'desc' },
      take: 5,
    });

    if (recentDeletedAccounts.length >= 2) {
      const now = Date.now();
      const allRecent = recentDeletedAccounts.every(
        (a: any) => a.deletedAt && (now - a.deletedAt.getTime()) < 7 * 24 * 60 * 60 * 1000,
      );

      if (allRecent) {
        await this.raiseFraudAlert(ledgerId, 'RAPID_CREATION_DELETION', 'HIGH', {
          recentDeletions: recentDeletedAccounts.length,
          detail: `${recentDeletedAccounts.length} accounts deleted within 7 days`,
        });
      }
    }
  }

  // ── Free-Plan Eligibility ─────────────────────────────────────────────

  async checkFreePlanEligibility(userId: string, signals: IdentitySignals): Promise<EligibilityResult> {
    const { ledger, isReturningUser, wasLinked } = await this.findOrCreateLedger(signals);

    this.logger.log(`checkFreePlanEligibility userId=${userId} signals=${JSON.stringify({ email: signals.email?.substring(0,3)+'***', phone: signals.phone ? '***'+signals.phone.slice(-4) : undefined, deviceFingerprint: signals.deviceFingerprint ? signals.deviceFingerprint.substring(0,8)+'...' : undefined, browserFingerprint: signals.browserFingerprint ? signals.browserFingerprint.substring(0,8)+'...' : undefined, ipAddress: signals.ipAddress, userAgent: signals.userAgent?.substring(0,50) })} ledger=${ledger.id} isReturning=${isReturningUser} wasLinked=${wasLinked}`);

    if (isReturningUser) {
      // Aggregate usage from all active linked accounts too
      const activeAccounts = await this.prisma.linkedAccount.findMany({
        where: { ledgerId: ledger.id, status: 'ACTIVE', userId: { not: null } },
        select: { userId: true },
      });
      const activeUserIds = activeAccounts.map((a: any) => a.userId).filter((uid: any): uid is string => uid !== null);

      let activeAi = 0;
      let activeAts = 0;
      if (activeUserIds.length > 0) {
        const [ai, ats] = await Promise.all([
          this.prisma.aIGeneration.count({ where: { userId: { in: activeUserIds }, status: 'completed', NOT: { type: 'ATS_SCAN' } } }),
          this.prisma.aIGeneration.count({ where: { userId: { in: activeUserIds }, type: 'ATS_SCAN', status: 'completed' } }),
        ]);
        activeAi = ai;
        activeAts = ats;
      }

      const totalAi = ledger.totalAiGenerations + activeAi;
      const totalAts = ledger.totalAtsScans + activeAts;
      const hasPhone = signals.phone || ledger.phone;

      this.logger.log(`checkFreePlanEligibility userId=${userId} result=RETURNING ledger=${ledger.id} risk=${ledger.riskLevel} exhausted=${ledger.freePlanExhausted} totalAi=${totalAi} totalAts=${totalAts}`);

      // Risk-based restrictions (soft, not hard blocks)
      if (ledger.riskLevel === 'HIGH_RISK' || ledger.riskLevel === 'SUSPICIOUS') {
        this.logger.warn(`checkFreePlanEligibility userId=${userId} result=DENIED_RISK ledger=${ledger.id} risk=${ledger.riskLevel} score=${ledger.riskScore}`);
        // Don't grant free credits for high/suspicious risk levels
        await this.prisma.riskEvent.create({
          data: {
            ledgerId: ledger.id,
            eventType: 'FREE_PLAN_RESTORED',
            details: {
              userId,
              result: 'denied_risk',
              riskLevel: ledger.riskLevel,
              riskScore: ledger.riskScore,
            },
          },
        });

        return {
          eligible: false,
          ledgerId: ledger.id,
          isReturningUser: true,
          previousUsage: {
            totalAiGenerations: totalAi,
            totalAtsScans: totalAts,
            totalResumeExports: ledger.totalResumeExports,
            totalCoverLetters: ledger.totalCoverLetters,
            freePlanExhausted: false,
          },
          riskScore: ledger.riskScore,
          riskLevel: ledger.riskLevel,
          message: 'Your account is under review. Please contact support.',
        };
      }

      if (ledger.riskLevel === 'MONITOR' && !hasPhone) {
        this.logger.warn(`checkFreePlanEligibility userId=${userId} result=DENIED_PHONE ledger=${ledger.id} risk=${ledger.riskLevel}`);
        // Medium risk without phone — require verification
        await this.prisma.riskEvent.create({
          data: {
            ledgerId: ledger.id,
            eventType: 'FREE_PLAN_RESTORED',
            details: {
              userId,
              result: 'denied_phone_required',
              reason: 'Phone verification required for medium risk identity',
            },
          },
        });

        return {
          eligible: false,
          ledgerId: ledger.id,
          isReturningUser: true,
          previousUsage: {
            totalAiGenerations: totalAi,
            totalAtsScans: totalAts,
            totalResumeExports: ledger.totalResumeExports,
            totalCoverLetters: ledger.totalCoverLetters,
            freePlanExhausted: false,
          },
          riskScore: ledger.riskScore,
          riskLevel: ledger.riskLevel,
          message: 'Please add a phone number to verify your account and access free features.',
        };
      }

      if (ledger.freePlanExhausted) {
        this.logger.warn(`checkFreePlanEligibility userId=${userId} result=EXHAUSTED ledger=${ledger.id} totalAi=${totalAi} totalAts=${totalAts}`);

        await this.prisma.riskEvent.create({
          data: {
            ledgerId: ledger.id,
            eventType: 'FREE_PLAN_RESTORED',
            details: {
              userId,
              result: 'denied',
              reason: 'Free plan already exhausted from previous accounts',
            },
          },
        });

        return {
          eligible: false,
          ledgerId: ledger.id,
          isReturningUser: true,
          previousUsage: {
            totalAiGenerations: totalAi,
            totalAtsScans: totalAts,
            totalResumeExports: ledger.totalResumeExports,
            totalCoverLetters: ledger.totalCoverLetters,
            freePlanExhausted: true,
          },
          riskScore: ledger.riskScore,
          riskLevel: ledger.riskLevel,
          message: 'Free plan benefits have already been used with a previous account.',
        };
      }

      // Not exhausted — restore remaining limits
      await this.prisma.riskEvent.create({
        data: {
          ledgerId: ledger.id,
          eventType: 'FREE_PLAN_RESTORED',
          details: {
            userId,
            result: 'restored',
            previousUsage: {
              aiGenerations: totalAi,
              atsScans: totalAts,
              resumeExports: ledger.totalResumeExports,
              coverLetters: ledger.totalCoverLetters,
            },
          },
        },
      });

      return {
        eligible: true,
        ledgerId: ledger.id,
        isReturningUser: true,
        previousUsage: {
          totalAiGenerations: totalAi,
          totalAtsScans: totalAts,
          totalResumeExports: ledger.totalResumeExports,
          totalCoverLetters: ledger.totalCoverLetters,
          freePlanExhausted: false,
        },
        riskScore: ledger.riskScore,
        riskLevel: ledger.riskLevel,
        message: `Previous usage restored. ${totalAi} AI generations, ${totalAts} ATS scans already consumed.`,
      };
    }

    this.logger.log(`checkFreePlanEligibility userId=${userId} result=NEW_USER ledger=${ledger.id} — free plan activated`);

    // New user — activate free plan
    await this.prisma.identityLedger.update({
      where: { id: ledger.id },
      data: { freePlanActivated: true },
    });

    await this.prisma.riskEvent.create({
      data: {
        ledgerId: ledger.id,
        eventType: 'FREE_PLAN_ACTIVATED',
        details: { userId, result: 'granted' },
      },
    });

    return {
      eligible: true,
      ledgerId: ledger.id,
      isReturningUser: false,
      previousUsage: {
        totalAiGenerations: 0,
        totalAtsScans: 0,
        totalResumeExports: 0,
        totalCoverLetters: 0,
        freePlanExhausted: false,
      },
      riskScore: 0,
      riskLevel: 'NORMAL',
    };
  }

  // ── Usage Ledger Backup (called on account deletion) ──────────────────

  async backupUsageToLedger(userId: string) {
    const link = await this.prisma.linkedAccount.findFirst({
      where: { userId, status: 'ACTIVE' },
    });
    if (!link) return;

    const ledgerId = link.ledgerId;

    // Count all-time usage across this specific user's records
    const [aiGenerations, atsScans, coverLetters] = await Promise.all([
      this.prisma.aIGeneration.count({
        where: { userId, status: 'completed', NOT: { type: 'ATS_SCAN' } },
      }),
      this.prisma.aIGeneration.count({
        where: { userId, type: 'ATS_SCAN', status: 'completed' },
      }),
      this.prisma.coverLetter.count({ where: { userId } }),
    ]);

    // Accumulate into the ledger
    await this.prisma.identityLedger.update({
      where: { id: ledgerId },
      data: {
        totalAiGenerations: { increment: aiGenerations },
        totalAtsScans: { increment: atsScans },
        totalCoverLetters: { increment: coverLetters },
      },
    });

    this.logger.log(`Backed up usage for user ${userId} to ledger ${ledgerId}: ${aiGenerations} AI, ${atsScans} ATS, ${coverLetters} cover letters`);

    // Check whether free plan is now exhausted
    const planLimits = await this.getPlanLimits(userId);
    const ledger = await this.prisma.identityLedger.findUnique({ where: { id: ledgerId } });
    if (!ledger) return;

    const exhausted =
      (ledger.totalAiGenerations >= (planLimits.aiGenerations || 10)) ||
      (ledger.totalAtsScans >= (planLimits.atsScans || 5));

    if (exhausted && !ledger.freePlanExhausted) {
      await this.prisma.identityLedger.update({
        where: { id: ledgerId },
        data: { freePlanExhausted: true },
      });
      this.logger.warn(`Free plan exhausted for ledger ${ledgerId} (${ledger.totalAiGenerations} AI, ${ledger.totalAtsScans} ATS)`);
    }
  }

  private async getPlanLimits(userId: string): Promise<{ aiGenerations: number; atsScans: number }> {
    const sub = await this.prisma.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
    const features = (sub?.plan?.features || '{}') as any;
    const parsed = typeof features === 'string' ? JSON.parse(features) : features;
    return {
      aiGenerations: parsed.aiGenerations ?? 10,
      atsScans: parsed.atsScans ?? 5,
    };
  }

  // ── Usage Check (called by AI service) ────────────────────────────────

  async getIdentityUsage(userId: string): Promise<{
    ledgerTotalAiGenerations: number;
    ledgerTotalAtsScans: number;
    freePlanExhausted: boolean;
  }> {
    const link = await this.prisma.linkedAccount.findFirst({
      where: { userId },
    });
    if (!link) {
      return { ledgerTotalAiGenerations: 0, ledgerTotalAtsScans: 0, freePlanExhausted: false };
    }

    const ledger = await this.prisma.identityLedger.findUnique({
      where: { id: link.ledgerId },
    });
    if (!ledger) {
      return { ledgerTotalAiGenerations: 0, ledgerTotalAtsScans: 0, freePlanExhausted: false };
    }

    // Also aggregate usage from all active linked accounts (not just deleted ones)
    const activeAccounts = await this.prisma.linkedAccount.findMany({
      where: { ledgerId: link.ledgerId, status: 'ACTIVE', userId: { not: null } },
      select: { userId: true },
    });

    const activeUserIds = activeAccounts
      .map((a: any) => a.userId)
      .filter((uid: any): uid is string => uid !== null && uid !== userId);

    let activeAiGenerations = 0;
    let activeAtsScans = 0;

    if (activeUserIds.length > 0) {
      const [aiCount, atsCount] = await Promise.all([
        this.prisma.aIGeneration.count({
          where: { userId: { in: activeUserIds }, status: 'completed', NOT: { type: 'ATS_SCAN' } },
        }),
        this.prisma.aIGeneration.count({
          where: { userId: { in: activeUserIds }, type: 'ATS_SCAN', status: 'completed' },
        }),
      ]);
      activeAiGenerations = aiCount;
      activeAtsScans = atsCount;
    }

    return {
      ledgerTotalAiGenerations: ledger.totalAiGenerations + activeAiGenerations,
      ledgerTotalAtsScans: ledger.totalAtsScans + activeAtsScans,
      freePlanExhausted: ledger.freePlanExhausted,
    };
  }

  // ── Risk Scoring ──────────────────────────────────────────────────────

  async recalculateRiskScore(ledgerId: string): Promise<{ score: number; level: string }> {
    const linkedAccounts = await this.prisma.linkedAccount.findMany({
      where: { ledgerId },
    });
    const ledger = await this.prisma.identityLedger.findUnique({ where: { id: ledgerId } });
    if (!ledger) return { score: 0, level: 'NORMAL' };

    let score = 0;

    // Multiple linked accounts (same identity)
    const activeCount = linkedAccounts.filter((a: any) => a.status === 'ACTIVE').length;
    const deletedCount = linkedAccounts.filter((a: any) => a.status === 'DELETED').length;

    if (activeCount + deletedCount > 3) score += 25;
    else if (activeCount + deletedCount > 1) score += 10;

    // Multiple deleted accounts
    if (deletedCount > 2) score += 20;
    else if (deletedCount > 1) score += 10;

    // Phone present
    if (ledger.phone) score += 5;

    // Phone verified (trust signal, reduces risk)
    const flags: string[] = (ledger.flags as any) || [];
    if (flags.includes('phone_verified')) score -= 10;

    // Device fingerprint
    if (ledger.deviceFingerprint) score += 5;

    // Previous free plan exhaustion
    if (ledger.freePlanExhausted) score += 15;

    // Accumulated events
    const events = await this.prisma.riskEvent.findMany({
      where: { ledgerId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const recentAccountCreations = events.filter(
      (e: any) => e.eventType === 'ACCOUNT_CREATED' &&
        e.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000),
    ).length;
    if (recentAccountCreations > 2) score += 15;

    const recentDeletions = events.filter(
      (e: any) => e.eventType === 'ACCOUNT_DELETED' &&
        e.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    ).length;
    if (recentDeletions > 2) score += 20;

    // Cap at 100
    score = Math.min(100, Math.max(0, score));

    // Determine level
    let level = 'NORMAL';
    if (score >= 81) level = 'HIGH_RISK';
    else if (score >= 61) level = 'SUSPICIOUS';
    else if (score >= 31) level = 'MONITOR';

    // Save
    const oldScore = ledger.riskScore;
    await this.prisma.identityLedger.update({
      where: { id: ledgerId },
      data: { riskScore: score, riskLevel: level as any },
    });

    // Log score change
    if (score !== oldScore) {
      await this.prisma.riskEvent.create({
        data: {
          ledgerId,
          eventType: 'RISK_SCORE_CHANGED',
          riskDelta: score - oldScore,
          previousScore: oldScore,
          newScore: score,
          details: { activeAccounts: activeCount, deletedAccounts: deletedCount },
        },
      });
    }

    // Auto-alert for high risk
    if (score >= 61) {
      const openAlerts = await this.prisma.fraudAlert.count({
        where: { ledgerId, status: 'OPEN' },
      });
      if (openAlerts === 0) {
        await this.raiseFraudAlert(
          ledgerId,
          score >= 81 ? 'SUSPICIOUS_PATTERN' : 'MULTIPLE_ACCOUNTS',
          score >= 81 ? 'HIGH' : 'MEDIUM',
          { riskScore: score, riskLevel: level, activeAccounts: activeCount, deletedAccounts: deletedCount },
        );
      }
    }

    return { score, level };
  }

  // ── Fraud Alerts ──────────────────────────────────────────────────────

  async raiseFraudAlert(ledgerId: string, type: string, severity: string, details: any) {
    const alert = await this.prisma.fraudAlert.create({
      data: { ledgerId, type, severity: severity as any, details },
    });

    await this.prisma.riskEvent.create({
      data: {
        ledgerId,
        eventType: 'FRAUD_ALERT_TRIGGERED',
        details: { alertId: alert.id, type, severity, ...details },
      },
    });

    this.logger.warn(`Fraud alert [${severity}] ${type} for ledger ${ledgerId}`);
    return alert;
  }

  // ── Admin Queries ─────────────────────────────────────────────────────

  async getOverview() {
    const [
      totalLedgers,
      highRiskLedgers,
      suspiciousLedgers,
      openAlerts,
      totalLinkedAccounts,
      deletedAccounts,
    ] = await Promise.all([
      this.prisma.identityLedger.count(),
      this.prisma.identityLedger.count({ where: { riskLevel: 'HIGH_RISK' } }),
      this.prisma.identityLedger.count({ where: { riskLevel: 'SUSPICIOUS' } }),
      this.prisma.fraudAlert.count({ where: { status: 'OPEN' } }),
      this.prisma.linkedAccount.count(),
      this.prisma.linkedAccount.count({ where: { status: 'DELETED' } }),
    ]);

    const criticalAlerts = await this.prisma.fraudAlert.count({
      where: { severity: 'CRITICAL', status: 'OPEN' },
    });
    const highAlerts = await this.prisma.fraudAlert.count({
      where: { severity: 'HIGH', status: 'OPEN' },
    });

    return {
      totalLedgers,
      highRiskLedgers,
      suspiciousLedgers,
      openAlerts,
      criticalAlerts,
      highAlerts,
      totalLinkedAccounts,
      deletedAccounts,
    };
  }

  async getLedgers(page: number, limit: number, search?: string, riskLevel?: string, sort?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (riskLevel && riskLevel !== 'ALL') {
      where.riskLevel = riskLevel;
    }

    if (search) {
      where.OR = [
        { phone: { contains: search, mode: 'insensitive' } },
        { linkedAccounts: { some: { email: { contains: search, mode: 'insensitive' } } } },
        { linkedAccounts: { some: { userId: { contains: search } } } },
      ];
    }

    let orderBy: any = { updatedAt: 'desc' };
    if (sort === 'risk') orderBy = { riskScore: 'desc' };
    else if (sort === 'created') orderBy = { createdAt: 'desc' };
    else if (sort === 'usage') orderBy = { totalAiGenerations: 'desc' };

    const [ledgers, total] = await Promise.all([
      this.prisma.identityLedger.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          linkedAccounts: {
            select: { id: true, userId: true, email: true, status: true, createdAt: true, deletedAt: true, oauthProvider: true },
          },
          fraudAlerts: {
            where: { status: 'OPEN' },
            select: { id: true, type: true, severity: true, createdAt: true },
            take: 3,
          },
          _count: { select: { riskEvents: true, linkedAccounts: true } },
        },
      }),
      this.prisma.identityLedger.count({ where }),
    ]);

    return { ledgers, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getLedgerById(id: string) {
    const ledger = await this.prisma.identityLedger.findUnique({
      where: { id },
      include: {
        linkedAccounts: true,
        riskEvents: { orderBy: { createdAt: 'desc' }, take: 50 },
        fraudAlerts: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!ledger) return null;

    const linkedAccounts = ledger.linkedAccounts || [];

    // Augment with usage data per linked active account
    const activeAccounts = linkedAccounts.filter((a: any) => a.status === 'ACTIVE');
    const accountDetails = await Promise.all(
      activeAccounts.map(async (a: any) => {
        if (!a.userId) return { id: a.id, userId: null, email: a.email, usage: null };
        const [aiGenerations, atsScans, resumes] = await Promise.all([
          this.prisma.aIGeneration.count({ where: { userId: a.userId } }),
          this.prisma.aTSScore.count({ where: { userId: a.userId } }),
          this.prisma.resume.count({ where: { userId: a.userId } }),
        ]);
        return {
          id: a.id,
          userId: a.userId,
          email: a.email,
          oauthProvider: a.oauthProvider,
          status: a.status,
          createdAt: a.createdAt,
          usage: { aiGenerations, atsScans, resumes },
        };
      }),
    );

    return { ...ledger, accountDetails };
  }

  async getAlerts(page: number, limit: number, status?: string, severity?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (severity && severity !== 'ALL') where.severity = severity;

    const [alerts, total] = await Promise.all([
      this.prisma.fraudAlert.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ledger: {
            select: { id: true, riskScore: true, riskLevel: true },
          },
        },
      }),
      this.prisma.fraudAlert.count({ where }),
    ]);

    return { alerts, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAlertStats() {
    const [open, reviewed, resolved, dismissed] = await Promise.all([
      this.prisma.fraudAlert.count({ where: { status: 'OPEN' } }),
      this.prisma.fraudAlert.count({ where: { status: 'REVIEWED' } }),
      this.prisma.fraudAlert.count({ where: { status: 'RESOLVED' } }),
      this.prisma.fraudAlert.count({ where: { status: 'DISMISSED' } }),
    ]);

    const bySeverity = await Promise.all(
      ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((s) =>
        this.prisma.fraudAlert.count({ where: { severity: s as any } }),
      ),
    );

    const byType = await Promise.all(
      ['MULTIPLE_ACCOUNTS', 'RAPID_CREATION_DELETION', 'EXCESSIVE_USAGE', 'SUSPICIOUS_PATTERN'].map((t) =>
        this.prisma.fraudAlert.count({ where: { type: t } }),
      ),
    );

    return {
      byStatus: { open, reviewed, resolved, dismissed },
      bySeverity: { LOW: bySeverity[0], MEDIUM: bySeverity[1], HIGH: bySeverity[2], CRITICAL: bySeverity[3] },
      byType: {
        MULTIPLE_ACCOUNTS: byType[0],
        RAPID_CREATION_DELETION: byType[1],
        EXCESSIVE_USAGE: byType[2],
        SUSPICIOUS_PATTERN: byType[3],
      },
    };
  }

  async resolveAlert(id: string, resolvedBy: string, status?: string) {
    return this.prisma.fraudAlert.update({
      where: { id },
      data: {
        status: (status as any) || 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy,
      },
    });
  }

  async flagLedger(ledgerId: string, flag: string, value: boolean) {
    const ledger = await this.prisma.identityLedger.findUnique({ where: { id: ledgerId } });
    if (!ledger) throw new Error('Ledger not found');

    const flags: string[] = (ledger.flags as any) || [];

    const updatedFlags = value
      ? [...new Set([...flags, flag])]
      : flags.filter((f) => f !== flag);

    await this.prisma.identityLedger.update({
      where: { id: ledgerId },
      data: { flags: updatedFlags },
    });

    return { id: ledgerId, flags: updatedFlags };
  }

  async verifyPhone(userId: string, phone: string) {
    const link = await this.prisma.linkedAccount.findFirst({
      where: { userId, status: 'ACTIVE' },
    });
    if (!link) throw new Error('User not linked to any identity ledger');

    const ledgerId = link.ledgerId;
    const ledger = await this.prisma.identityLedger.findUnique({ where: { id: ledgerId } });
    if (!ledger) throw new Error('Ledger not found');

    // Update ledger phone if not already set
    if (!ledger.phone) {
      await this.prisma.identityLedger.update({
        where: { id: ledgerId },
        data: { phone },
      });
    }

    // Add phone_verified flag
    await this.flagLedger(ledgerId, 'phone_verified', true);

    // Log verification event
    await this.prisma.riskEvent.create({
      data: {
        ledgerId,
        eventType: 'PHONE_VERIFIED',
        details: { phone, previousRiskLevel: ledger.riskLevel, previousRiskScore: ledger.riskScore },
      },
    });

    // Recalculate risk score (phone_verified reduces risk)
    const { score, level } = await this.recalculateRiskScore(ledgerId);

    return {
      verified: true,
      ledgerId,
      riskScore: score,
      riskLevel: level,
    };
  }

  async getAuditLog(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      this.prisma.riskEvent.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ledger: { select: { id: true, riskScore: true, riskLevel: true } },
        },
      }),
      this.prisma.riskEvent.count(),
    ]);

    return { events, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
