"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabase } from "@/providers/supabase-provider";
import { api } from "@/lib/api";
import { formatDateRelative } from "@/lib/utils";
import { FileText, Plus, ArrowRight, Loader2, Trash2, Globe, Download } from "lucide-react";

export default function ResumesPage() {
  const { user } = useSupabase();
  const [resumes, setResumes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get("/resumes").then(setResumes).catch(() => {}).finally(() => setIsLoading(false));
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
          <h1 className="text-3xl font-bold">My Resumes</h1>
          <p className="text-muted-foreground">Manage and edit your resumes</p>
        </div>
        <Link href="/resumes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Resume
          </Button>
        </Link>
      </div>

      {resumes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <CardTitle className="mb-2">No resumes yet</CardTitle>
            <CardDescription className="mb-6">Create your first resume to get started</CardDescription>
            <Link href="/resumes/new">
              <Button>Create Your First Resume</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {resumes.map((resume: any) => (
            <Card key={resume.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-6">
                <Link href={`/resumes/${resume.id}`} className="flex items-center gap-4 flex-1">
                  <FileText className="h-8 w-8 text-primary/60" />
                  <div>
                    <h3 className="font-semibold text-lg">{resume.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Updated {formatDateRelative(resume.updatedAt)}
                      {resume.isPublic && (
                        <span className="inline-flex items-center gap-1 ml-3 text-green-600">
                          <Globe className="h-3 w-3" /> Public
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); api.download(`/resumes/${resume.id}/download`); }}>
                  <Download className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
