"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Upload, FileText, BarChart3, ArrowUpRight } from "lucide-react";

export default function ATSScannerPage() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!resumeText || !jobDescription) {
      toast.error("Please provide both resume content and job description");
      return;
    }
    setIsAnalyzing(true);
    try {
      const res = await api.post("/ai/analyze-ats", { resume: { content: resumeText }, jobDescription });
      setResult(res);
    } catch (err: any) {
      toast.error(err.message || "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">ATS Score Analyzer</h1>
        <p className="text-muted-foreground">Check how your resume performs against Applicant Tracking Systems.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resume & Job Description</CardTitle>
            <CardDescription>Paste your resume content and the job description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Resume Content</label>
              <textarea className="w-full min-h-[200px] mt-1 rounded-md border border-input bg-transparent p-3 text-sm" value={resumeText} onChange={(e) => setResumeText(e.target.value)} placeholder="Paste your resume content here..." />
            </div>
            <div>
              <label className="text-sm font-medium">Job Description</label>
              <textarea className="w-full min-h-[200px] mt-1 rounded-md border border-input bg-transparent p-3 text-sm" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the job description here..." />
            </div>
            <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
              {isAnalyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : <><BarChart3 className="mr-2 h-4 w-4" /> Analyze ATS Score</>}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                ATS Score: {result.score}/100
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold" style={{ color: result.score >= 80 ? "#22c55e" : result.score >= 60 ? "#eab308" : "#ef4444" }}>
                  {result.score}
                </div>
                <div className="text-sm text-muted-foreground">
                  {result.score >= 80 ? "Excellent! Your resume is well-optimized." : result.score >= 60 ? "Good, but there is room for improvement." : "Needs significant improvement."}
                </div>
              </div>

              {result.breakdown && (
                <div className="space-y-2">
                  <h3 className="font-medium">Breakdown</h3>
                  {Object.entries(result.breakdown).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-sm capitalize w-24">{key.replace(/_/g, " ")}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${value}%` }} />
                      </div>
                      <span className="text-sm font-mono">{value}%</span>
                    </div>
                  ))}
                </div>
              )}

              {result.missingKeywords?.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Missing Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywords.map((kw: string) => (
                      <span key={kw} className="inline-flex items-center bg-destructive/10 text-destructive px-2 py-1 rounded text-xs">{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {result.recommendations?.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Recommendations</h3>
                  <ul className="space-y-1">
                    {result.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <ArrowUpRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
