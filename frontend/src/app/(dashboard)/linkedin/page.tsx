"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Linkedin, Sparkles, Copy, Check, RefreshCw } from "lucide-react";

export default function LinkedInOptimizerPage() {
  const [headline, setHeadline] = useState("");
  const [about, setAbout] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copiedSection, setCopiedSection] = useState("");

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      const res = await api.post("/ai/optimize-linkedin", {
        profile: { headline, about },
      });
      setResult(res);
      await api.post("/linkedin", res);
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
    toast.success("Copied!");
  };

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Linkedin className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">LinkedIn Profile Optimizer</h1>
          <p className="text-muted-foreground">Optimize your LinkedIn profile for maximum recruiter visibility.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Current Profile</CardTitle>
            <CardDescription>Enter your current LinkedIn headline and about section</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Current Headline</label>
              <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g., Software Engineer at Acme Corp" />
            </div>
            <div>
              <label className="text-sm font-medium">About Section</label>
              <textarea className="w-full min-h-[200px] mt-1 rounded-md border border-input bg-transparent p-3 text-sm" value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Paste your current About section..." />
            </div>
            <Button onClick={handleOptimize} disabled={isOptimizing} className="w-full">
              {isOptimizing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Optimizing...</> : <><Sparkles className="mr-2 h-4 w-4" /> Optimize with AI</>}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {result && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Optimized Headline</span>
                    <Button variant="ghost" size="sm" onClick={() => copyText(result.headline, "headline")}>
                      {copiedSection === "headline" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium">{result.headline}</p>
                  <p className="text-xs text-muted-foreground mt-2">Score: {result.score}/100</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Optimized About Section</span>
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
                <Card>
                  <CardHeader>
                    <CardTitle>Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.suggestions.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-1">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
