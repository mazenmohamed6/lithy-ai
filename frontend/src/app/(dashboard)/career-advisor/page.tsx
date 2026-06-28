"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Compass, ArrowRight, BookOpen, Briefcase, TrendingUp, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export default function CareerAdvisorPage() {
  const { t, locale } = useI18n();
  const [currentRole, setCurrentRole] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [industry, setIndustry] = useState("");
  const [isAdvising, setIsAdvising] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAdvise = async () => {
    if (!currentRole || !targetRole || !experience) {
      toast.error("Please provide your current role, target role, and experience");
      return;
    }
    setIsAdvising(true);
    try {
      const res = await api.post("/ai/career-advisor", {
        currentRole,
        targetRole,
        experience,
        skills: skills ? skills.split(",").map((s) => s.trim()) : [],
        industry: industry || undefined,
      }, { retries: 1 });
      setResult(res);
    } catch (err: any) {
      toast.error(err.message || "Career advisory failed");
    } finally {
      setIsAdvising(false);
    }
  };

  return (
    <div className={`container py-8 space-y-8 animate-fade-in ${locale === "ar" ? "text-right" : ""}`}>
      <div>
        <h1 className="text-3xl font-bold">{t("careerAdvisor.title")}</h1>
        <p className="text-muted-foreground">{t("careerAdvisor.subtitle")}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Compass className="h-5 w-5" />
              {t("careerAdvisor.input")}
            </CardTitle>
            <CardDescription>{t("careerAdvisor.inputDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t("careerAdvisor.currentRole")}</label>
                <input className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm" value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} placeholder="e.g. Junior Developer" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t("careerAdvisor.targetRole")}</label>
                <input className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Senior Engineer" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t("careerAdvisor.experience")}</label>
                <input type="number" className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 3" min="0" max="50" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t("careerAdvisor.industry")}</label>
                <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="">Select...</option>
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
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t("careerAdvisor.skills")}</label>
              <textarea className="w-full min-h-[80px] rounded-md border border-input bg-transparent p-3 text-sm resize-y" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="JavaScript, React, Node.js, Python" />
            </div>
            <Button onClick={handleAdvise} disabled={isAdvising} className="w-full gap-2">
              {isAdvising ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("careerAdvisor.advising")} </> : <><Compass className="h-4 w-4" /> {t("careerAdvisor.advise")}</>}
            </Button>
          </CardContent>
        </Card>

        {!result && !isAdvising && (
          <Card className="card-hover border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Compass className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium mb-2">{t("careerAdvisor.noResult")}</h3>
              <p className="text-sm text-muted-foreground max-w-sm">{t("careerAdvisor.inputDesc")}</p>
            </CardContent>
          </Card>
        )}

        {isAdvising && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Getting career advice...</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <div className="space-y-6 animate-slide-in-right">
            {result.careerPath?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    {t("careerAdvisor.careerPath")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {result.careerPath.map((step: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">{i + 1}</span>
                        <span className="text-muted-foreground pt-1">{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}

            {result.skillGaps?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {t("careerAdvisor.skillGaps")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.skillGaps.map((gap: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{gap.skill}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            gap.importance === "critical" ? "bg-red-500/10 text-red-600" :
                            gap.importance === "important" ? "bg-yellow-500/10 text-yellow-600" :
                            "bg-blue-500/10 text-blue-600"
                          }`}>
                            {gap.importance}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{gap.howToAcquire}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {result.recommendedRoles?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ArrowRight className="h-5 w-5" />
                    {t("careerAdvisor.recommendedRoles")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.recommendedRoles.map((role: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                        {role}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {result.learningResources?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {t("careerAdvisor.learningResources")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.learningResources.map((resource: any, i: number) => (
                    <div key={i}>
                      <h4 className="text-sm font-medium mb-2 capitalize">{resource.category}</h4>
                      <ul className="space-y-1">
                        {resource.suggestions?.map((s: string, j: number) => (
                          <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                            <ArrowRight className="h-3 w-3 shrink-0 mt-1" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              {result.timeline && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {t("careerAdvisor.timeline")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{result.timeline}</p>
                  </CardContent>
                </Card>
              )}
              {result.marketInsights && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      {t("careerAdvisor.marketInsights")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{result.marketInsights}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
