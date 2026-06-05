"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { Loader2, Sparkles, Copy, Check, Lightbulb, Users, Building2 } from "lucide-react";
import { ResumeUpload } from "@/components/resume-upload";

export default function InterviewQuestionsPage() {
  const { t, locale } = useI18n();
  const [resumeText, setResumeText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [language, setLanguage] = useState("en");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"technical" | "behavioral" | "company">("technical");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!jobTitle) {
      toast.error(locale === "ar" ? "يرجى إدخال المسمى الوظيفي" : "Please enter a job title");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await api.post("/ai/interview-questions", {
        resume: { content: resumeText || "Use the user's latest resume" },
        jobTitle,
        jobDescription,
        companyName,
        language,
      });
      setResult(res);
    } catch (err: any) {
      toast.error(err.message || "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyAll = () => {
    if (!result) return;
    const text = [
      ...(result.technicalQuestions || []).map((q: any) => `Q: ${q.question}`),
      ...(result.behavioralQuestions || []).map((q: any) => `Q: ${q.question}`),
      ...(result.companySpecificQuestions || []).map((q: any) => `Q: ${q.question}`),
    ].join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(locale === "ar" ? "تم النسخ" : "Copied!");
  };

  const hasCompanyQuestions = result?.companySpecificQuestions?.length > 0;

  return (
    <div className={`container py-8 space-y-8 animate-fade-in ${locale === "ar" ? "text-right" : ""}`}>
      <div>
        <h1 className="text-3xl font-bold">{t("interviewQuestions.title")}</h1>
        <p className="text-muted-foreground">{t("interviewQuestions.subtitle")}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-lg">{t("interviewQuestions.jobDetails")}</CardTitle>
            <CardDescription>{t("interviewQuestions.jobDetailsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("interviewQuestions.jobTitle")}</label>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder={locale === "ar" ? "مثال: مهندس برمجيات" : "e.g. Software Engineer"}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("interviewQuestions.companyName")}</label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={locale === "ar" ? "اسم الشركة (اختياري)" : "Acme Corp (optional)"}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("interviewQuestions.language")}</label>
              <select
                className="w-full mt-1 rounded-md border border-input bg-transparent p-2 text-sm"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">{t("interviewQuestions.resume")}</label>
              <ResumeUpload onResumeText={setResumeText} initialText={resumeText} />
            </div>
            <div>
              <label className="text-sm font-medium">{t("interviewQuestions.jobDesc")}</label>
              <textarea
                className="w-full min-h-[200px] mt-1 rounded-md border border-input bg-transparent p-3 text-sm"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder={locale === "ar" ? "الصق الوصف الوظيفي هنا..." : "Paste the job description here (optional)..."}
              />
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full gap-2">
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t("interviewQuestions.generating")}</>
              ) : (
                <><Sparkles className="h-4 w-4" /> {t("interviewQuestions.generate")}</>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {result ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant={activeTab === "technical" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTab("technical")}
                    className="gap-1.5"
                  >
                    <Lightbulb className="h-4 w-4" />
                    {t("interviewQuestions.technical")}
                    <span className="ml-1 text-xs opacity-70">({(result.technicalQuestions || []).length})</span>
                  </Button>
                  <Button
                    variant={activeTab === "behavioral" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTab("behavioral")}
                    className="gap-1.5"
                  >
                    <Users className="h-4 w-4" />
                    {t("interviewQuestions.behavioral")}
                    <span className="ml-1 text-xs opacity-70">({(result.behavioralQuestions || []).length})</span>
                  </Button>
                  {hasCompanyQuestions && (
                    <Button
                      variant={activeTab === "company" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveTab("company")}
                      className="gap-1.5"
                    >
                      <Building2 className="h-4 w-4" />
                      {t("interviewQuestions.company")}
                      <span className="ml-1 text-xs opacity-70">({result.companySpecificQuestions.length})</span>
                    </Button>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={copyAll} className="gap-1.5">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? t("interviewQuestions.copied") : t("interviewQuestions.copy")}
                </Button>
              </div>

              {activeTab === "technical" && (
                <div className="space-y-4">
                  {(result.technicalQuestions || []).length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center text-muted-foreground">
                        {t("interviewQuestions.noQuestions")}
                      </CardContent>
                    </Card>
                  )}
                  {(result.technicalQuestions || []).map((q: any, i: number) => (
                    <Card key={i} className="card-hover">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <CardTitle className="text-base font-medium leading-relaxed">
                            <span className="text-primary mr-2">{i + 1}.</span>
                            {q.question}
                          </CardTitle>
                          {q.difficulty && (
                            <span className={cn(
                              "shrink-0 text-xs font-medium px-2 py-0.5 rounded-full",
                              q.difficulty === "junior" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                              q.difficulty === "mid" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                              q.difficulty === "senior" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                            )}>
                              {q.difficulty}
                            </span>
                          )}
                        </div>
                        <CardDescription>{q.category}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {q.approach && (
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                              {locale === "ar" ? "المنهجية" : "Approach"}
                            </p>
                            <p className="text-sm text-foreground/90 leading-relaxed">{q.approach}</p>
                          </div>
                        )}
                        {q.keyPoints && q.keyPoints.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                              {locale === "ar" ? "النقاط الرئيسية" : "Key Points"}
                            </p>
                            <ul className="list-disc list-inside space-y-0.5">
                              {q.keyPoints.map((kp: string, j: number) => (
                                <li key={j} className="text-sm text-foreground/80">{kp}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {activeTab === "behavioral" && (
                <div className="space-y-4">
                  {(result.behavioralQuestions || []).length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center text-muted-foreground">
                        {t("interviewQuestions.noQuestions")}
                      </CardContent>
                    </Card>
                  )}
                  {(result.behavioralQuestions || []).map((q: any, i: number) => (
                    <Card key={i} className="card-hover">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <CardTitle className="text-base font-medium leading-relaxed">
                            <span className="text-primary mr-2">{i + 1}.</span>
                            {q.question}
                          </CardTitle>
                          {q.category && (
                            <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              {q.category}
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {q.starFramework && (
                          <div className="space-y-2 text-sm border-l-2 border-primary/30 pl-4">
                            {q.starFramework.situation && (
                              <div>
                                <span className="font-semibold text-primary">{locale === "ar" ? "الموقف: " : "Situation: "}</span>
                                <span className="text-foreground/80">{q.starFramework.situation}</span>
                              </div>
                            )}
                            {q.starFramework.task && (
                              <div>
                                <span className="font-semibold text-primary">{locale === "ar" ? "المهمة: " : "Task: "}</span>
                                <span className="text-foreground/80">{q.starFramework.task}</span>
                              </div>
                            )}
                            {q.starFramework.action && (
                              <div>
                                <span className="font-semibold text-primary">{locale === "ar" ? "الإجراء: " : "Action: "}</span>
                                <span className="text-foreground/80">{q.starFramework.action}</span>
                              </div>
                            )}
                            {q.starFramework.result && (
                              <div>
                                <span className="font-semibold text-primary">{locale === "ar" ? "النتيجة: " : "Result: "}</span>
                                <span className="text-foreground/80">{q.starFramework.result}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {activeTab === "company" && (
                <div className="space-y-4">
                  {(result.companySpecificQuestions || []).length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center text-muted-foreground">
                        {t("interviewQuestions.noCompanyInfo")}
                      </CardContent>
                    </Card>
                  )}
                  {(result.companySpecificQuestions || []).map((q: any, i: number) => (
                    <Card key={i} className="card-hover">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium leading-relaxed">
                          <span className="text-primary mr-2">{i + 1}.</span>
                          {q.question}
                        </CardTitle>
                        {q.category && (
                          <CardDescription>{q.category}</CardDescription>
                        )}
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Card className="h-full">
              <CardContent className="flex flex-col items-center justify-center min-h-[500px] text-muted-foreground">
                <Sparkles className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-center">{t("interviewQuestions.noResult")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}