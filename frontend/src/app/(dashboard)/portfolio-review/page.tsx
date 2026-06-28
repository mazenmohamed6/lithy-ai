"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Globe, CheckCircle2, AlertTriangle, Lightbulb, Code, Star, Target } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

function getScoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#eab308";
  return "#ef4444";
}

export default function PortfolioReviewPage() {
  const { t, locale } = useI18n();
  const [githubUsername, setGithubUsername] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleReview = async () => {
    if (!description) {
      toast.error("Please provide a portfolio description");
      return;
    }
    setIsReviewing(true);
    try {
      const res = await api.post("/ai/portfolio-review", {
        githubUsername: githubUsername || undefined,
        portfolioUrl: portfolioUrl || undefined,
        description,
        role: role || undefined,
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
        <h1 className="text-3xl font-bold">{t("portfolioReview.title")}</h1>
        <p className="text-muted-foreground">{t("portfolioReview.subtitle")}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t("portfolioReview.input")}
            </CardTitle>
            <CardDescription>{t("portfolioReview.inputDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t("portfolioReview.githubUsername")}</label>
                <input className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm" value={githubUsername} onChange={(e) => setGithubUsername(e.target.value)} placeholder="e.g. johndoe" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t("portfolioReview.portfolioUrl")}</label>
                <input className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="e.g. johndoe.dev" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t("portfolioReview.description")}</label>
              <textarea className="w-full min-h-[120px] rounded-md border border-input bg-transparent p-3 text-sm resize-y" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your portfolio, key projects, and technologies used..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t("portfolioReview.role")}</label>
              <input className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Frontend Developer" />
            </div>
            <Button onClick={handleReview} disabled={isReviewing} className="w-full gap-2">
              {isReviewing ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("portfolioReview.reviewing")} </> : <><Globe className="h-4 w-4" /> {t("portfolioReview.review")}</>}
            </Button>
          </CardContent>
        </Card>

        {!result && !isReviewing && (
          <Card className="card-hover border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Globe className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium mb-2">{t("portfolioReview.noResult")}</h3>
              <p className="text-sm text-muted-foreground max-w-sm">{t("portfolioReview.inputDesc")}</p>
            </CardContent>
          </Card>
        )}

        {isReviewing && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Reviewing your portfolio...</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <div className="space-y-6 animate-slide-in-right">
            {result.overallScore !== undefined && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{t("portfolioReview.overallScore")}</CardTitle>
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

            <div className="grid sm:grid-cols-2 gap-6">
              {result.strengths?.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      {t("portfolioReview.strengths")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.strengths.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Star className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {result.improvements?.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      {t("portfolioReview.improvements")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.improvements.map((imp: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                          {imp}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {result.codeQuality && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    {t("portfolioReview.codeQuality")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{result.codeQuality}</p>
                </CardContent>
              </Card>
            )}

            {result.projectFeedback?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{t("portfolioReview.projectFeedback")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.projectFeedback.map((proj: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{proj.project || `Project ${i + 1}`}</h4>
                        {proj.score !== undefined && (
                          <span className="text-sm font-mono" style={{ color: getScoreColor(proj.score) }}>{proj.score}%</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{proj.notes}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {result.presentationFeedback && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">{t("portfolioReview.presentationFeedback")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{result.presentationFeedback}</p>
                </CardContent>
              </Card>
            )}

            {result.recommendations?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    {t("portfolioReview.recommendations")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {result.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                        <span className="text-muted-foreground">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {result.recruiterAppeal && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">{t("portfolioReview.recruiterAppeal")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{result.recruiterAppeal}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
