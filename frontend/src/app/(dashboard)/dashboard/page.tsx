"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSupabase } from "@/providers/supabase-provider";
import { api } from "@/lib/api";
import { formatDateRelative } from "@/lib/utils";
import { FileText, Sparkles, BarChart3, Target, Plus, ArrowRight, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user } = useSupabase();
  const [resumes, setResumes] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get("/resumes").catch(() => []),
      api.get("/users/usage").catch(() => null),
    ]).then(([resumesData, usageData]) => {
      setResumes(resumesData);
      setUsage(usageData);
      setIsLoading(false);
    });
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.email?.split("@")[0]}</p>
        </div>
        <Link href="/resumes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Resume
          </Button>
        </Link>
      </div>

      {usage && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">AI Generations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usage.aiGenerations || 0}</div>
              {usage.aiGenerations != null && <p className="text-xs text-muted-foreground">this month</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ATS Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usage.atsScans || 0}</div>
              <p className="text-xs text-muted-foreground">this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Job Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usage.jobMatches || 0}</div>
              <p className="text-xs text-muted-foreground">this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Resumes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usage.resumeCount || 0}</div>
              <p className="text-xs text-muted-foreground">total</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Resumes
            </CardTitle>
            <CardDescription>Your recently updated resumes</CardDescription>
          </CardHeader>
          <CardContent>
            {resumes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No resumes yet</p>
                <Link href="/resumes/new">
                  <Button variant="outline" size="sm" className="mt-4">Create your first resume</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {resumes.slice(0, 5).map((resume: any) => (
                  <Link key={resume.id} href={`/resumes/${resume.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                    <div>
                      <p className="font-medium">{resume.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDateRelative(resume.updatedAt)}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>AI-powered tools to boost your career</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/resumes/new">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Create Resume with AI
              </Button>
            </Link>
            <Link href="/ats-scanner">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analyze ATS Score
              </Button>
            </Link>
            <Link href="/job-match">
              <Button variant="outline" className="w-full justify-start">
                <Target className="mr-2 h-4 w-4" />
                Check Job Match
              </Button>
            </Link>
            <Link href="/cover-letters">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Generate Cover Letter
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
