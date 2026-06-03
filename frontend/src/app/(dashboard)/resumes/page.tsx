"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSupabase } from "@/providers/supabase-provider";
import { api } from "@/lib/api";
import { formatDateRelative } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { FileText, Plus, ArrowRight, Loader2, Download, Sparkles, Upload } from "lucide-react";

export default function ResumesPage() {
  const { user } = useSupabase();
  const { t, locale } = useI18n();
  const [resumes, setResumes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get("/resumes").then(setResumes).catch(() => {}).finally(() => setIsLoading(false));
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
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${locale === "ar" ? "text-right" : ""}`}>
            {locale === "ar" ? "سيرتي الذاتية" : "My Resumes"}
          </h1>
          <p className={`text-muted-foreground ${locale === "ar" ? "text-right" : ""}`}>
            {locale === "ar" ? "إدارة وتحرير سيرك الذاتية" : "Manage and edit your resumes"}
          </p>
        </div>
        <Link href="/resumes/new">
          <Button className="gap-2">
            <Plus className="size-4" />
            {locale === "ar" ? "سيرة ذاتية جديدة" : "New Resume"}
          </Button>
        </Link>
      </div>

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
              <Link href="/resumes/new">
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
        <div className="grid gap-4">
          {resumes.map((resume: any) => (
            <Card key={resume.id} className="card-hover">
              <CardContent className="flex items-center justify-between p-5">
                <Link href={`/resumes/${resume.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="size-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{resume.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {locale === "ar" ? "آخر تحديث" : "Updated"} {formatDateRelative(resume.updatedAt)}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="icon" className="size-9" onClick={(e) => { e.stopPropagation(); api.download(`/resumes/${resume.id}/download-pdf`); }} title={locale === "ar" ? "تحميل PDF" : "Download PDF"}>
                    <Download className="size-4" />
                  </Button>
                  <ArrowRight className="size-4 text-muted-foreground hidden sm:block" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
