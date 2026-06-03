"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSupabase } from "@/providers/supabase-provider";
import { api } from "@/lib/api";
import { formatDateRelative } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { FileText, Sparkles, BarChart3, Target, Plus, ArrowRight, Loader2, TrendingUp, CheckCircle, Clock, Lightbulb, GraduationCap } from "lucide-react";

export default function DashboardPage() {
  const { user } = useSupabase();
  const { t, locale } = useI18n();
  const [resumes, setResumes] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
  }, [user]);

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

  const quickLinks = [
    { href: "/resumes/new", label: t("dashboard.createResumeAI"), icon: FileText },
    { href: "/ats-scanner", label: t("dashboard.analyzeATS"), icon: BarChart3 },
    { href: "/job-match", label: t("dashboard.checkJobMatch"), icon: Target },
    { href: "/cover-letters", label: t("dashboard.generateCoverLetter"), icon: FileText },
  ];

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

      {usage && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("dashboard.resumeCompletion"), value: `${completionScore}%`, icon: CheckCircle, color: "text-green-500", desc: `${resumeCount} resume${resumeCount !== 1 ? "s" : ""} created` },
            { label: t("dashboard.atsImprovement"), value: `${atsImprovement}%`, icon: TrendingUp, color: "text-blue-500", desc: `${atsScans} scan${atsScans !== 1 ? "s" : ""} performed` },
            { label: t("dashboard.aiUsage"), value: aiGenerations, icon: Sparkles, color: "text-purple-500", desc: "this month" },
            { label: t("dashboard.subscription"), value: usage.plan || "Free", icon: GraduationCap, color: "text-orange-500", desc: usage.plan === "FREE" ? "Upgrade for more" : "Active" },
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
                    {locale === "ar" ? `عرض الكل (${resumes.length})` : `View all (${resumes.length})`}
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
