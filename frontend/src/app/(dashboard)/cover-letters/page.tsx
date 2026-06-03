"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { AI_TONES } from "@/lib/constants";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { Loader2, Sparkles, Copy, Check } from "lucide-react";
import { ResumeUpload } from "@/components/resume-upload";

export default function CoverLettersPage() {
  const { t, locale } = useI18n();
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState("professional");
  const [companyName, setCompanyName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!jobDescription) {
      toast.error(t("coverLetter.enterJob"));
      return;
    }
    setIsGenerating(true);
    try {
      const res = await api.post("/ai/cover-letter", {
        resume: { content: resumeText || "Use the user's latest resume" },
        jobDescription,
        tone,
        companyName,
      });
      setGeneratedContent(res.content);
    } catch (err: any) {
      toast.error(err.message || "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t("coverLetter.copied"));
  };

  return (
    <div className={`container py-8 space-y-8 animate-fade-in ${locale === "ar" ? "text-right" : ""}`}>
      <div>
        <h1 className="text-3xl font-bold">{t("coverLetter.title")}</h1>
        <p className="text-muted-foreground">{t("coverLetter.subtitle")}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-lg">{t("coverLetter.jobDetails")}</CardTitle>
            <CardDescription>{t("coverLetter.jobDetailsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("coverLetter.companyName")}</label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Corp" />
            </div>
            <div>
              <label className="text-sm font-medium">{t("coverLetter.tone")}</label>
              <select className="w-full mt-1 rounded-md border border-input bg-transparent p-2 text-sm" value={tone} onChange={(e) => setTone(e.target.value)}>
                {AI_TONES.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">{t("coverLetter.resume")}</label>
              <ResumeUpload onResumeText={setResumeText} initialText={resumeText} />
            </div>
            <div>
              <label className="text-sm font-medium">{t("coverLetter.jobDesc")}</label>
              <textarea className="w-full min-h-[250px] mt-1 rounded-md border border-input bg-transparent p-3 text-sm" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the job description here..." />
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full gap-2">
              {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("coverLetter.generating")}</> : <><Sparkles className="h-4 w-4" /> {t("coverLetter.generate")}</>}
            </Button>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t("coverLetter.result")}</span>
              {generatedContent && (
                <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-1.5">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? t("coverLetter.copied") : t("coverLetter.copy")}
                </Button>
              )}
            </CardTitle>
            <CardDescription>{t("coverLetter.resultDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {generatedContent ? (
              <div className="whitespace-pre-wrap text-sm leading-relaxed font-serif p-4 bg-muted/30 rounded-lg min-h-[400px]">
                {generatedContent}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
                <Sparkles className="h-12 w-12 mb-4 opacity-50" />
                <p>{t("coverLetter.noResult")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
