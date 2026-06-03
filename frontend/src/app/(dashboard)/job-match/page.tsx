"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { Loader2, Target, ArrowUpRight, CheckCircle2, XCircle } from "lucide-react";
import { ResumeUpload } from "@/components/resume-upload";

function getScoreColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 50) return "#eab308";
  return "#ef4444";
}

function SkillBadge({ skill, matched }: { skill: string; matched: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
      matched ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
    }`}>
      {matched ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {skill}
    </span>
  );
}

export default function JobMatchPage() {
  const { t, locale } = useI18n();
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!resumeText || !jobDescription) {
      toast.error("Please provide both resume and job description");
      return;
    }
    setIsAnalyzing(true);
    try {
      const res = await api.post("/ai/analyze-job-match", { resume: { content: resumeText }, jobDescription });
      setResult(res);
    } catch (err: any) {
      toast.error(err.message || "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`container py-8 space-y-8 animate-fade-in ${locale === "ar" ? "text-right" : ""}`}>
      <div>
        <h1 className="text-3xl font-bold">{t("jobMatch.title")}</h1>
        <p className="text-muted-foreground">{t("jobMatch.subtitle")}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-lg">{t("jobMatch.input")}</CardTitle>
            <CardDescription>{t("jobMatch.inputDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("jobMatch.resume")}</label>
              <ResumeUpload onResumeText={setResumeText} initialText={resumeText} />
            </div>
            <div>
              <label className="text-sm font-medium">{t("jobMatch.jobDesc")}</label>
              <textarea className="w-full min-h-[200px] mt-1 rounded-md border border-input bg-transparent p-3 text-sm resize-y" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the job description..." />
            </div>
            <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full gap-2">
              {isAnalyzing ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("jobMatch.analyzing")}</> : <><Target className="h-4 w-4" /> {t("jobMatch.analyze")}</>}
            </Button>
          </CardContent>
        </Card>

        {isAnalyzing && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">{t("jobMatch.loadingResult")}</p>
            </CardContent>
          </Card>
        )}

        {!result && !isAnalyzing && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Target className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-sm text-muted-foreground">{t("jobMatch.noResult")}</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="card-hover animate-slide-in-right">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {t("jobMatch.overallMatch")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative inline-flex">
                  <svg width="100" height="100" className="-rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke={getScoreColor(result.matchPercentage)} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 42}`} strokeDashoffset={`${2 * Math.PI * 42 * (1 - (result.matchPercentage || 0) / 100)}`} style={{ transition: "stroke-dashoffset 1s ease-out" }} />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold" style={{ color: getScoreColor(result.matchPercentage) }}>{result.matchPercentage}%</span>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-lg">{t("jobMatch.matchStrength")}</div>
                  <p className="text-sm text-muted-foreground">
                    {result.matchPercentage >= 70
                      ? "Strong match! Your resume aligns well with this role."
                      : result.matchPercentage >= 50
                      ? "Moderate match. Consider adding missing skills."
                      : "Weak match. Significant skill gaps detected."}
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {result.matchedSkills?.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm mb-2 flex items-center gap-1.5 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      {t("jobMatch.matchedSkills")} ({result.matchedSkills.length})
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {result.matchedSkills.map((s: string) => (
                        <SkillBadge key={s} skill={s} matched />
                      ))}
                    </div>
                  </div>
                )}

                {result.missingSkills?.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm mb-2 flex items-center gap-1.5 text-red-600">
                      <XCircle className="h-4 w-4" />
                      {t("jobMatch.missingSkills")} ({result.missingSkills.length})
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {result.missingSkills.map((s: string) => (
                        <SkillBadge key={s} skill={s} matched={false} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="h-px bg-border" />

              <div className="space-y-2">
                <h3 className="font-medium text-sm flex items-center gap-1.5">
                  <ArrowUpRight className="h-4 w-4 text-primary" />
                  {t("jobMatch.recommendations")}
                </h3>
                {result.recommendations?.length > 0 ? (
                  <ul className="space-y-2">
                    {result.recommendations.map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                        <span className="text-muted-foreground">{r}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No specific recommendations.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
