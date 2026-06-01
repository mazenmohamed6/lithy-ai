"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Target, ArrowUpRight } from "lucide-react";
import { ResumeUpload } from "@/components/resume-upload";

export default function JobMatchPage() {
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
    <div className="container py-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Job Match Analyzer</h1>
        <p className="text-muted-foreground">See how well your resume matches a job description.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-lg">Input</CardTitle>
            <CardDescription>Paste your resume and the job description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Your Resume</label>
              <ResumeUpload onResumeText={setResumeText} initialText={resumeText} />
            </div>
            <div>
              <label className="text-sm font-medium">Job Description</label>
              <textarea className="w-full min-h-[200px] mt-1 rounded-md border border-input bg-transparent p-3 text-sm" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the job description..." />
            </div>
            <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
              {isAnalyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : <><Target className="mr-2 h-4 w-4" /> Analyze Match</>}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="card-hover animate-slide-in-right">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Match: {result.matchPercentage}%
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold" style={{ color: result.matchPercentage >= 70 ? "#22c55e" : result.matchPercentage >= 50 ? "#eab308" : "#ef4444" }}>
                  {result.matchPercentage}%
                </div>
              </div>

              {result.matchedSkills?.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Matched Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.matchedSkills.map((s: string) => (
                      <span key={s} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {result.missingSkills?.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Missing Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.missingSkills.map((s: string) => (
                      <span key={s} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {result.recommendations?.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Recommendations</h3>
                  <ul className="space-y-1">
                    {result.recommendations.map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm"><ArrowUpRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />{r}</li>
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
