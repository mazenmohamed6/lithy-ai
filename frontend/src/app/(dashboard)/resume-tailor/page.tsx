"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Wand2, CheckCircle2, ArrowUpRight, Lightbulb, Target } from "lucide-react";
import { ResumeUpload } from "@/components/resume-upload";
import { useI18n } from "@/lib/i18n/context";

export default function ResumeTailorPage() {
  const { t, locale } = useI18n();
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [tone, setTone] = useState("professional");
  const [isTailoring, setIsTailoring] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTailor = async () => {
    if (!resumeText || !jobDescription) {
      toast.error("Please provide both resume and job description");
      return;
    }
    setIsTailoring(true);
    try {
      const res = await api.post("/ai/resume-tailor", {
        resume: { content: resumeText },
        jobDescription,
        companyName: companyName || undefined,
        tone,
      }, { retries: 1 });
      setResult(res);
    } catch (err: any) {
      toast.error(err.message || "Tailoring failed");
    } finally {
      setIsTailoring(false);
    }
  };

  return (
    <div className={`container py-8 space-y-8 animate-fade-in ${locale === "ar" ? "text-right" : ""}`}>
      <div>
        <h1 className="text-3xl font-bold">{t("resumeTailor.title")}</h1>
        <p className="text-muted-foreground">{t("resumeTailor.subtitle")}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t("resumeTailor.input")}
            </CardTitle>
            <CardDescription>{t("resumeTailor.inputDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t("resumeTailor.resume")}</label>
              <ResumeUpload onResumeText={setResumeText} initialText={resumeText} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t("resumeTailor.jobDesc")}</label>
              <textarea className="w-full min-h-[200px] rounded-md border border-input bg-transparent p-3 text-sm resize-y" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the job description here..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t("resumeTailor.companyName")}</label>
                <input className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Optional" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t("resumeTailor.tone")}</label>
                <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="professional">Professional</option>
                  <option value="creative">Creative</option>
                  <option value="concise">Concise</option>
                  <option value="detailed">Detailed</option>
                  <option value="confident">Confident</option>
                </select>
              </div>
            </div>
            <Button onClick={handleTailor} disabled={isTailoring} className="w-full gap-2">
              {isTailoring ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("resumeTailor.tailoring")} </> : <><Wand2 className="h-4 w-4" /> {t("resumeTailor.tailor")}</>}
            </Button>
          </CardContent>
        </Card>

        {!result && !isTailoring && (
          <Card className="card-hover border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Wand2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium mb-2">{t("resumeTailor.noResult")}</h3>
              <p className="text-sm text-muted-foreground max-w-sm">{t("resumeTailor.inputDesc")}</p>
            </CardContent>
          </Card>
        )}

        {isTailoring && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Tailoring your resume...</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <div className="space-y-6 animate-slide-in-right">
            {result.matchScore !== undefined && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {t("resumeTailor.matchScore")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className={`text-4xl font-bold ${result.matchScore >= 70 ? "text-green-500" : result.matchScore >= 50 ? "text-yellow-500" : "text-red-500"}`}>
                      {result.matchScore}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {result.tailoredSections?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Optimized Sections</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.tailoredSections.map((section: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50">
                      <h4 className="font-medium text-sm mb-1 capitalize">{section.sectionName || `Section ${i + 1}`}</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{typeof section.content === 'string' ? section.content : JSON.stringify(section.content)}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="grid sm:grid-cols-2 gap-6">
              {result.changes?.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      {t("resumeTailor.changes")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.changes.map((change: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <ArrowUpRight className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          {change}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {result.keywordsAdded?.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-500" />
                      {t("resumeTailor.keywordsAdded")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {result.keywordsAdded.map((kw: string, i: number) => (
                        <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {result.suggestions?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    {t("resumeTailor.suggestions")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {result.suggestions.map((tip: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                        <span className="text-muted-foreground">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
