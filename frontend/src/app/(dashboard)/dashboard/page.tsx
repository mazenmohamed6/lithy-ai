"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabase } from "@/providers/supabase-provider";
import { api } from "@/lib/api";
import { formatDateRelative } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { FileText, Sparkles, BarChart3, Target, Plus, ArrowRight, Loader2, TrendingUp, CheckCircle, Clock, Lightbulb, GraduationCap, Award, Zap, Medal, Star, Gift, Wand2, FileCheck, Compass, Globe } from "lucide-react";

const badgeDefs = [
  { id: "first-resume", tKey: "dashboard.badges.firstResume", icon: FileText, condition: (c: number) => c >= 1 },
  { id: "resume-5", tKey: "dashboard.badges.resume5", icon: Award, condition: (c: number) => c >= 5 },
  { id: "ats-scanner", tKey: "dashboard.badges.atsScanner", icon: BarChart3, condition: (_: number, s: number) => s >= 3 },
  { id: "ai-master", tKey: "dashboard.badges.aiMaster", icon: Sparkles, condition: (_: number, __: number, a: number) => a >= 10 },
  { id: "streak-7", tKey: "dashboard.badges.streak7", icon: Medal, condition: () => false },
  { id: "cover-letter", tKey: "dashboard.badges.coverLetter", icon: FileText, condition: () => false },
];

const weeklyGoalDefs = [
  { id: "create-1", tKey: "dashboard.goals.createResume", icon: FileText, key: "resumeCreated" as const },
  { id: "scan-ats", tKey: "dashboard.goals.scanAts", icon: BarChart3, key: "atsScanned" as const },
  { id: "generate-ai", tKey: "dashboard.goals.generateAi", icon: Sparkles, key: "aiGenerated" as const },
  { id: "match-job", tKey: "dashboard.goals.matchJob", icon: Target, key: "jobMatchChecked" as const },
];

export default function DashboardPage() {
  const { user } = useSupabase();
  const { t, locale } = useI18n();
  const [resumes, setResumes] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyProgress, setWeeklyProgress] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get("/resumes").catch(() => []),
      api.get("/users/usage").catch(() => null),
    ]).then(([resumesData, usageData]) => {
      setResumes(resumesData);
      setUsage(usageData);
      setIsLoading(false);
    });
    const stored = localStorage.getItem("weeklyGoals");
    if (stored) setWeeklyProgress(JSON.parse(stored));
  }, [user]);

  const toggleGoal = (id: string) => {
    setWeeklyProgress((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem("weeklyGoals", JSON.stringify(next));
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-10 w-36 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const userName = user?.user_metadata?.fullName || user?.email?.split("@")[0] || "";
  const resumeCount = usage?.resumeCount || resumes.length || 0;
  const aiGenerations = usage?.aiGenerations || 0;
  const atsScans = usage?.atsScans || 0;
  const completionScore = Math.min(resumeCount * 25, 100);
  const atsImprovement = Math.min(atsScans * 10, 100);

  const coachMessages = [
    t("dashboard.coach.greeting"),
    t("dashboard.coach.tip1"),
    t("dashboard.coach.tip2"),
    t("dashboard.coach.tip3"),
  ];

  const earnedBadges = badgeDefs.filter((b) => b.condition(resumeCount, atsScans, aiGenerations));
  const lockedBadges = badgeDefs.filter((b) => !b.condition(resumeCount, atsScans, aiGenerations));

  const quickLinks = [
    { href: "/resumes/new?mode=ai", label: t("dashboard.createResumeAI"), icon: FileText },
    { href: "/ats-scanner", label: t("dashboard.analyzeATS"), icon: BarChart3 },
    { href: "/resume-tailor", label: t("dashboard.tailorResume"), icon: Wand2 },
    { href: "/resume-review", label: t("dashboard.resumeReview"), icon: FileCheck },
    { href: "/career-advisor", label: t("dashboard.careerAdvisor"), icon: Compass },
    { href: "/portfolio-review", label: t("dashboard.portfolioReview"), icon: Globe },
    { href: "/job-match", label: t("dashboard.checkJobMatch"), icon: Target },
    { href: "/cover-letters", label: t("dashboard.generateCoverLetter"), icon: FileText },
  ];

  const completedGoals = Object.values(weeklyProgress).filter(Boolean).length;
  const totalGoals = weeklyGoalDefs.length;

  return (
    <div className={`container py-8 space-y-8 animate-fade-in ${locale === "ar" ? "text-right" : ""}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground">{t("dashboard.welcome")}, {userName}</p>
        </div>
        <Link href="/resumes/new">
          <Button className="gap-2 shadow-sm">
            <Plus className="size-4" />
            {t("dashboard.newResume")}
          </Button>
        </Link>
      </div>

      {usage?.freePlanExhausted && (
        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4 flex items-start gap-3">
          <Clock className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-orange-800 dark:text-orange-300">{t("dashboard.freePlanExhaustedTitle")}</p>
            <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
              {t("dashboard.freePlanExhaustedDesc")}
            </p>
          </div>
          <Link href="/billing" className="shrink-0 ml-auto">
            <Button size="sm" variant="default" className="bg-orange-600 hover:bg-orange-700">{t("dashboard.upgrade")}</Button>
          </Link>
        </div>
      )}

      {usage?.totalAiGenerations > 0 && !usage?.freePlanExhausted && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
          <Clock className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-blue-800 dark:text-blue-300">{t("dashboard.consolidatedTitle")}</p>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              {t("dashboard.consolidatedDesc")} <strong>{usage.totalAiGenerations} AI generations</strong> and <strong>{usage.totalAtsScans} ATS scans</strong> have been used across all your accounts.
            </p>
          </div>
        </div>
      )}

      {usage && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("dashboard.resumeCompletion"), value: `${completionScore}%`, icon: CheckCircle, color: "text-green-500", desc: locale === "ar" ? `تم إنشاء ${resumeCount}` : `${resumeCount} created` },
            { label: t("dashboard.atsImprovement"), value: `${atsImprovement}%`, icon: TrendingUp, color: "text-blue-500", desc: locale === "ar" ? `تم الفحص ${atsScans}` : `${atsScans} scanned` },
            { label: t("dashboard.aiUsage"), value: `${aiGenerations}`, icon: Sparkles, color: "text-purple-500", desc: t("dashboard.thisMonth") },
            { label: t("dashboard.subscription"), value: usage.plan === "FREE" ? t("dashboard.statusFree") : (usage.plan || t("dashboard.statusFree")), icon: GraduationCap, color: "text-orange-500", desc: usage.plan === "FREE" ? t("dashboard.statusUpgrade") : t("dashboard.statusActive") },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="card-hover">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
                  <Icon className={`size-4 ${item.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{item.value}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border bg-primary/5 p-5 flex items-start gap-4">
        <Lightbulb className="size-6 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-medium mb-1">{coachMessages[0]}</p>
          <p className="text-sm text-muted-foreground">{coachMessages[Math.min(1 + (resumeCount % 3), coachMessages.length - 1)]}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="size-4" />
              {t("dashboard.weeklyGoals")}
              <span className="text-xs text-muted-foreground font-normal ml-auto">{completedGoals}/{totalGoals}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {weeklyGoalDefs.map((goal) => {
              const GoalIcon = goal.icon;
              const done = weeklyProgress[goal.id];
              return (
                <button
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                    done ? "bg-green-500/5 border-green-500/20" : "hover:bg-muted"
                  }`}
                >
                  <div className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    done ? "bg-green-500 border-green-500" : "border-muted-foreground/30"
                  }`}>
                    {done && <CheckCircle className="size-4 text-white" />}
                  </div>
                  <GoalIcon className={`size-4 shrink-0 ${done ? "text-green-500" : "text-muted-foreground"}`} />
                  <span className={`text-sm ${done ? "line-through text-muted-foreground" : ""}`}>{t(goal.tKey)}</span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="size-4" />
              {t("dashboard.achievements")}
              <span className="text-xs text-muted-foreground font-normal ml-auto">{earnedBadges.length}/{badgeDefs.length}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {earnedBadges.map((badge) => {
                const BadgeIcon = badge.icon;
                return (
                  <div key={badge.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
                    <BadgeIcon className="size-4 text-primary" />
                    <span className="text-xs font-medium">{t(`${badge.tKey}.label`)}</span>
                  </div>
                );
              })}
              {lockedBadges.map((badge) => {
                const BadgeIcon = badge.icon;
                return (
                  <div key={badge.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-dashed opacity-50">
                    <BadgeIcon className="size-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t(`${badge.tKey}.label`)}</span>
                  </div>
                );
              })}
              {badgeDefs.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("dashboard.createFirstResume")}</p>
              )}
            </div>
            {lockedBadges.length > 0 && (
              <p className="text-xs text-muted-foreground mt-3">
                {t("dashboard.nextMilestone")}: {t(`${lockedBadges[0].tKey}.desc`)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" />
              {t("dashboard.recentActivity")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resumes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium mb-1">{t("empty.noResumes")}</p>
                <p className="text-sm mb-4">{t("empty.noResumesDesc")}</p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Link href="/resumes/new">
                    <Button size="sm" className="gap-2">
                      <Plus className="size-3.5" />
                      {t("empty.createResume")}
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {resumes.slice(0, 5).map((resume: any) => (
                  <Link key={resume.id} href={`/resumes/${resume.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group">
                    <div className="flex items-center gap-3">
                      <FileText className="size-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{resume.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDateRelative(resume.updatedAt)}</p>
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
                {resumes.length > 5 && (
                  <Link href="/resumes" className="block text-center text-sm text-primary pt-2 hover:underline">
                    {t("dashboard.viewAll")} ({resumes.length})
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4" />
              {t("dashboard.quickActions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href}>
                  <Button variant="outline" className="w-full justify-start gap-3 h-11">
                    <Icon className="size-4 text-primary" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {resumes.length > 0 && (
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4" />
              {t("dashboard.careerProgress")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { label: t("dashboard.resumeCompletion"), value: completionScore, color: "bg-green-500" },
                { label: t("dashboard.atsImprovement"), value: atsImprovement, color: "bg-blue-500" },
                { label: t("dashboard.aiUsage"), value: Math.min(aiGenerations * 10, 100), color: "bg-purple-500" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="relative size-20 mx-auto mb-3">
                    <svg className="size-20 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${item.value} ${100 - item.value}`} strokeLinecap="round" className={item.color} />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{item.value}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
