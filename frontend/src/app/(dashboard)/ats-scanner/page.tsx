"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, BarChart3, ArrowUpRight, CheckCircle2, XCircle, AlertTriangle, Lightbulb, RefreshCw, Target } from "lucide-react";
import { ResumeUpload } from "@/components/resume-upload";

function getScoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#eab308";
  return "#ef4444";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Work";
  return "Needs Attention";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-green-500/10 border-green-500/20";
  if (score >= 60) return "bg-yellow-500/10 border-yellow-500/20";
  return "bg-red-500/10 border-red-500/20";
}

function ScoreGauge({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
        <circle cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 1s ease-out" }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function KeywordBadge({ keyword, matched }: { keyword: string; matched: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
      matched ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
    }`}>
      {matched ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {keyword}
    </span>
  );
}

export default function ATSScannerPage() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [industry, setIndustry] = useState("tech");

  const handleAnalyze = async () => {
    if (!resumeText || !jobDescription) {
      toast.error("Please provide both resume content and job description");
      return;
    }
    setIsAnalyzing(true);
    try {
      const res = await api.post("/ai/analyze-ats", {
        resume: { content: resumeText },
        jobDescription,
        industry,
      }, { retries: 1 });
      setResult(res);
    } catch (err: any) {
      toast.error(err.message || "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container py-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">ATS Score Analyzer</h1>
        <p className="text-muted-foreground">Optimize your resume to pass Applicant Tracking Systems and land more interviews.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Resume & Job Description
            </CardTitle>
            <CardDescription>Paste your resume content and the target job description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Resume Content</label>
              <ResumeUpload onResumeText={setResumeText} initialText={resumeText} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Industry <span className="text-muted-foreground font-normal">(for keyword matching)</span></label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm"
              >
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
            <div>
              <label className="text-sm font-medium mb-1.5 block">Job Description</label>
              <textarea className="w-full min-h-[200px] rounded-md border border-input bg-transparent p-3 text-sm resize-y" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the job description here..." />
            </div>
            <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full gap-2">
              {isAnalyzing ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing... </> : <><BarChart3 className="h-4 w-4" /> Analyze ATS Score</>}
            </Button>
          </CardContent>
        </Card>

        {!result && !isAnalyzing && (
          <Card className="card-hover border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium mb-2">Your results will appear here</h3>
              <p className="text-sm text-muted-foreground max-w-sm">Paste your resume and job description above, then click &quot;Analyze ATS Score&quot; to see how well your resume matches.</p>
            </CardContent>
          </Card>
        )}

        {isAnalyzing && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Analyzing your resume against the job description...</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <div className="space-y-6 animate-slide-in-right">
            <Card className={getScoreBg(result.score)}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5" />
                  ATS Compatibility Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <ScoreGauge score={result.score} />
                  <div className="space-y-2">
                    <div className="text-lg font-semibold">{getScoreLabel(result.score)}</div>
                    <p className="text-sm text-muted-foreground">
                      {result.score >= 80
                        ? "Your resume is well-optimized for ATS systems. Great job!"
                        : result.score >= 60
                        ? "Your resume is decent but has room for improvement to stand out."
                        : result.score >= 40
                        ? "Your resume needs significant changes to pass ATS filters."
                        : "Your resume is unlikely to pass ATS filters. Consider rewriting it."}
                    </p>
                    {result.score < 80 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        Estimated <strong>{70 - Math.min(result.score, 70)}%</strong> of applications filtered out
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {result.breakdown && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Score Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(result.breakdown).map(([key, value]: [string, any]) => (
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
              {result.matchedKeywords?.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Matched Keywords ({result.matchedKeywords.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {result.matchedKeywords.map((kw: string) => (
                        <KeywordBadge key={kw} keyword={kw} matched />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {result.missingKeywords?.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
                      <XCircle className="h-4 w-4" />
                      Missing Keywords ({result.missingKeywords.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {result.missingKeywords.map((kw: string) => (
                        <KeywordBadge key={kw} keyword={kw} matched={false} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {result.keywordScore !== undefined && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Keyword Match Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-bold" style={{ color: getScoreColor(result.keywordScore) }}>
                        {result.keywordScore}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {result.keywordScore >= 70
                          ? "Strong keyword alignment"
                          : result.keywordScore >= 50
                          ? "Moderate keyword alignment"
                          : "Weak keyword alignment"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {result.formatScore !== undefined && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Format & Parsing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-bold" style={{ color: getScoreColor(result.formatScore) }}>
                        {result.formatScore}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {result.formatScore >= 70
                          ? "ATS-friendly formatting"
                          : result.formatScore >= 50
                          ? "Some formatting issues"
                          : "Major formatting problems"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {result.recommendations?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    Recommendations
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

            <Button variant="outline" onClick={() => { setResult(null); }} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Analyze Another Resume
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
