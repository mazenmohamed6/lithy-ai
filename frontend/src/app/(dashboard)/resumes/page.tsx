"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSupabase } from "@/providers/supabase-provider";
import { api } from "@/lib/api";
import { formatDateRelative } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { FileText, Plus, ArrowRight, Loader2, Download, Sparkles, Upload, Search, Clock, CheckCircle2, AlertTriangle, TrendingUp, Trash2 } from "lucide-react";

function getScoreBadge(score: number | null | undefined) {
  if (score == null) return null;
  if (score >= 80) return { label: `ATS ${score}`, variant: "default" as const, color: "bg-green-500/10 text-green-600 border-green-500/20" };
  if (score >= 60) return { label: `ATS ${score}`, variant: "secondary" as const, color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" };
  return { label: `ATS ${score}`, variant: "outline" as const, color: "bg-red-500/10 text-red-600 border-red-500/20" };
}

export default function ResumesPage() {
  const { user } = useSupabase();
  const { t, locale } = useI18n();
  const [resumes, setResumes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"updated" | "created" | "title">("updated");

  useEffect(() => {
    if (!user) return;
    api.get("/resumes").then(setResumes).catch(() => {}).finally(() => setIsLoading(false));
  }, [user]);

  const filteredResumes = useMemo(() => {
    let list = [...resumes];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => r.title?.toLowerCase().includes(q));
    }
    if (sortBy === "title") {
      list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortBy === "created") {
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else {
      list.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
    }
    return list;
  }, [resumes, searchQuery, sortBy]);

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
        <div className="h-10 w-full bg-muted rounded-lg animate-pulse" />
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${locale === "ar" ? "text-right" : ""}`}>
            {locale === "ar" ? "سيرتي الذاتية" : "My Resumes"}
          </h1>
          <p className={`text-muted-foreground ${locale === "ar" ? "text-right" : ""}`}>
            {locale === "ar" ? `إدارة وتحرير سيرك الذاتية (${resumes.length})` : `Manage and edit your resumes (${resumes.length})`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/resumes/new?mode=ai">
            <Button variant="outline" className="gap-2">
              <Sparkles className="size-4" />
              {locale === "ar" ? "توليد بالذكاء الاصطناعي" : "AI Generate"}
            </Button>
          </Link>
          <Link href="/resumes/new">
            <Button className="gap-2 shadow-sm">
              <Plus className="size-4" />
              {locale === "ar" ? "جديد" : "New"}
            </Button>
          </Link>
        </div>
      </div>

      {resumes.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === "ar" ? "ابحث عن سيرة ذاتية..." : "Search resumes..."}
              className="pl-9"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="updated">{locale === "ar" ? "آخر تحديث" : "Last Updated"}</option>
            <option value="created">{locale === "ar" ? "تاريخ الإنشاء" : "Date Created"}</option>
            <option value="title">{locale === "ar" ? "العنوان" : "Title"}</option>
          </select>
        </div>
      )}

      {filteredResumes.length === 0 && resumes.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-12">
            <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="font-medium mb-1">{locale === "ar" ? "لا توجد نتائج" : "No results found"}</h3>
            <p className="text-sm text-muted-foreground">{locale === "ar" ? "حاول تغيير مصطلح البحث" : "Try a different search term"}</p>
          </CardContent>
        </Card>
      )}

      {resumes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16">
            <div className="size-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
              <FileText className="size-10 text-primary/60" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t("empty.noResumes")}</h3>
            <p className="text-muted-foreground mb-8 max-w-md text-center">{t("empty.noResumesDesc")}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/resumes/new">
                <Button className="gap-2 shadow-sm">
                  <Plus className="size-4" />
                  {t("empty.createResume")}
                </Button>
              </Link>
              <Link href="/resumes/new?mode=ai">
                <Button variant="outline" className="gap-2">
                  <Sparkles className="size-4" />
                  {t("empty.generateAI")}
                </Button>
              </Link>
              <Link href="/resumes/new">
                <Button variant="outline" className="gap-2">
                  <Upload className="size-4" />
                  {t("empty.uploadResume")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredResumes.map((resume: any) => {
            const badge = getScoreBadge(resume.atsScore);
            return (
              <Card key={resume.id} className="card-hover group">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{resume.title || "Untitled"}</h3>
                      {badge && (
                        <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${badge.color}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {locale === "ar" ? "آخر تحديث" : "Updated"} {formatDateRelative(resume.updatedAt)}
                      </span>
                      {resume.createdAt && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {locale === "ar" ? "تم الإنشاء" : "Created"} {formatDateRelative(resume.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="size-9" onClick={(e) => { e.stopPropagation(); api.download(`/resumes/${resume.id}/download-pdf`); }} title={locale === "ar" ? "تحميل PDF" : "Download PDF"}>
                      <Download className="size-4" />
                    </Button>
                    <Link href={`/resumes/${resume.id}`}>
                      <Button variant="ghost" size="icon" className="size-9">
                        <ArrowRight className="size-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {resumes.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>{locale === "ar" ? `إجمالي ${resumes.length} سيرة ذاتية` : `${resumes.length} resume${resumes.length !== 1 ? "s" : ""} total`}</span>
          <span>{locale === "ar" ? `${filteredResumes.length} معروضة` : `${filteredResumes.length} shown`}</span>
        </div>
      )}
    </div>
  );
}
