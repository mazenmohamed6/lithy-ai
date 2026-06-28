"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, FileCheck, CheckCircle2, XCircle, AlertTriangle, Lightbulb, Target } from "lucide-react";
import { ResumeUpload } from "@/components/resume-upload";
import { useI18n } from "@/lib/i18n/context";

function getScoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#eab308";
  return "#ef4444";
}

export default function ResumeReviewPage() {
  const { t, locale } = useI18n();
  const [resumeText, setResumeText] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("mid");
  const [industry, setIndustry] = useState("tech");
  const [isReviewing, setIsReviewing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleReview = async () => {
    if (!resumeText) {
      toast.error("Please provide your resume content");
      return;
    }
    setIsReviewing(true);
    try {
      const res = await api.post("/ai/resume-review", {
        resume: { content: resumeText },
        experienceLevel,
        industry,
      }, { retries: 1 });
      setResult(res);
    } catch (err: any) {
      toast.error(err.message || "Review failed");
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className={`container py-8 space-y-8 animate-fade-in ${locale === "ar" ? "text-right" : ""}`}>
      <div>
        <h1 className="text-3xl font-bold">{t("resumeReview.title")}</h1>
        <p className="text-muted-foreground">{t("resumeReview.subtitle")}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t("resumeReview.input")}
            </CardTitle>
            <CardDescription>{t("resumeReview.inputDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t("resumeReview.resume")}</label>
              <ResumeUpload onResumeText={setResumeText} initialText={resumeText} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t("resumeReview.experienceLevel")}</label>
                <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="executive">Executive Level</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t("resumeReview.industry")}</label>
                <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="tech">Technology</option>
                  <option value="finance">Finance & Banking</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="marketing">Marketing & Sales</option>
                  <option value="engineering">Engineering</option>
                  <option value="legal">Legal</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>
            <Button onClick={handleReview} disabled={isReviewing} className="w-full gap-2">
              {isReviewing ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("resumeReview.reviewing")} </> : <><FileCheck className="h-4 w-4" /> {t("resumeReview.review")}</>}
            </Button>
          </CardContent>
        </Card>

        {!result && !isReviewing && (
          <Card className="card-hover border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileCheck className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium mb-2">{t("resumeReview.noResult")}</h3>
              <p className="text-sm text-muted-foreground max-w-sm">{t("resumeReview.inputDesc")}</p>
            </CardContent>
          </Card>
        )}

        {isReviewing && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Reviewing your resume...</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <div className="space-y-6 animate-slide-in-right">
            {result.overallScore !== undefined && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{t("resumeReview.overallScore")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="text-5xl font-bold" style={{ color: getScoreColor(result.overallScore) }}>
                      {result.overallScore}
                    </div>
                    <div className="text-sm text-muted-foreground">/ 100</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {result.sectionScores && Object.keys(result.sectionScores).length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{t("resumeReview.sectionScores")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(result.sectionScores).map(([key, value]: [string, any]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm capitalize">{key.replace(/_/g, " ")}</span>
                        <span className="text-sm font-mono">{value}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, backgroundColor: getScoreColor(value) }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="grid sm:grid-cols-2 gap-6">
              {result.strengths?.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      {t("resumeReview.strengths")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.strengths.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {result.weaknesses?.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
                      <XCircle className="h-4 w-4" />
                      {t("resumeReview.weaknesses")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.weaknesses.map((w: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {result.actionableImprovements?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    {t("resumeReview.improvements")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {result.actionableImprovements.map((imp: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                        <span className="text-muted-foreground">{imp}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {(result.formatFeedback || result.contentFeedback || result.atsReadiness) && (
              <div className="grid sm:grid-cols-3 gap-4">
                {result.formatFeedback && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">{t("resumeReview.formatFeedback")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{result.formatFeedback}</p>
                    </CardContent>
                  </Card>
                )}
                {result.contentFeedback && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">{t("resumeReview.contentFeedback")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{result.contentFeedback}</p>
                    </CardContent>
                  </Card>
                )}
                {result.atsReadiness && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">{t("resumeReview.atsReadiness")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{result.atsReadiness}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
