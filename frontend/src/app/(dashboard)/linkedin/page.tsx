"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { Loader2, Linkedin, Sparkles, Copy, Check } from "lucide-react";

export default function LinkedInOptimizerPage() {
  const { t, locale } = useI18n();
  const [headline, setHeadline] = useState("");
  const [about, setAbout] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copiedSection, setCopiedSection] = useState("");

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      const res = await api.post("/ai/optimize-linkedin", { profile: { headline, about } });
      setResult(res);
      await api.post("/linkedin", res).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || "Optimization failed");
    } finally {
      setIsOptimizing(false);
    }
  };

  const copyText = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(""), 2000);
    toast.success(t("linkedin.copied"));
  };

  return (
    <div className={`container py-8 space-y-8 animate-fade-in ${locale === "ar" ? "text-right" : ""}`}>
      <div className="flex items-center gap-3">
        <Linkedin className="h-8 w-8 text-blue-600 shrink-0" />
        <div>
          <h1 className="text-3xl font-bold">{t("linkedin.title")}</h1>
          <p className="text-muted-foreground">{t("linkedin.subtitle")}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-lg">{t("linkedin.currentProfile")}</CardTitle>
            <CardDescription>{t("linkedin.currentProfileDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("linkedin.headline")}</label>
              <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g., Software Engineer at Acme Corp" />
            </div>
            <div>
              <label className="text-sm font-medium">{t("linkedin.about")}</label>
              <textarea className="w-full min-h-[200px] mt-1 rounded-md border border-input bg-transparent p-3 text-sm" value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Paste your current About section..." />
            </div>
            <Button onClick={handleOptimize} disabled={isOptimizing} className="w-full gap-2">
              {isOptimizing ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("linkedin.optimizing")}</> : <><Sparkles className="h-4 w-4" /> {t("linkedin.optimize")}</>}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {result ? (
            <>
              <Card className="card-hover animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{t("linkedin.optimizedHeadline")}</span>
                    <Button variant="ghost" size="sm" onClick={() => copyText(result.headline, "headline")}>
                      {copiedSection === "headline" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium">{result.headline}</p>
                  {result.score !== undefined && (
                    <p className="text-xs text-muted-foreground mt-2">{t("linkedin.score")}: {result.score}/100</p>
                  )}
                </CardContent>
              </Card>

              <Card className="card-hover animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{t("linkedin.optimizedAbout")}</span>
                    <Button variant="ghost" size="sm" onClick={() => copyText(result.about, "about")}>
                      {copiedSection === "about" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{result.about}</p>
                </CardContent>
              </Card>

              {result.suggestions?.length > 0 && (
                <Card className="card-hover animate-slide-up">
                  <CardHeader>
                    <CardTitle>{t("linkedin.suggestions")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.suggestions.map((s: string, i: number) => (
                        <li key={i} className={`flex items-start gap-2 text-sm ${locale === "ar" ? "flex-row-reverse text-right" : ""}`}>
                          <span className="text-primary mt-1 shrink-0">&#8226;</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Linkedin className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-sm text-muted-foreground">{t("linkedin.noResult")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
