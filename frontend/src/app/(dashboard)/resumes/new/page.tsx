"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Sparkles, FileText, Upload } from "lucide-react";

export default function NewResumePage() {
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a resume title");
      return;
    }
    setIsCreating(true);
    try {
      const resume = await api.post("/resumes", { title: title.trim() });
      router.push(`/resumes/${resume.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create resume");
      setIsCreating(false);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!title.trim()) {
      toast.error("Please enter a job title to generate a resume");
      return;
    }
    setIsGenerating(true);
    try {
      const resume = await api.post("/resumes", { title: `${title.trim()} - AI Generated` });
      const { id } = resume;
      await api.post(`/ai/generate-resume`, { resumeId: id, jobTitle: title });
      router.push(`/resumes/${id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate resume");
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(pdf|docx|doc|txt)$/i)) {
      toast.error("Only PDF, DOCX, and TXT files are supported");
      return;
    }

    setFileName(file.name);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const resume = await api.upload("/resumes/upload", formData);
      toast.success("Resume uploaded successfully!");
      router.push(`/resumes/${resume.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload resume");
      setIsUploading(false);
    }
  };

  return (
    <div className="container py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Resume</h1>
        <p className="text-muted-foreground">Start building your professional resume</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Resume Details</CardTitle>
            <CardDescription>Give your resume a title to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Resume Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Software Engineer - Google"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={isCreating || isGenerating || isUploading}>
                  {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                  Create Resume
                </Button>
                <Button type="button" variant="secondary" disabled={isCreating || isGenerating || isUploading} onClick={handleGenerateWithAI}>
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Generate with AI
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload from Device</CardTitle>
            <CardDescription>Upload an existing resume (PDF, DOCX, TXT)</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Uploading {fileName}...</p>
                </div>
              ) : fileName ? (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-primary" />
                  <p className="text-sm font-medium">{fileName}</p>
                  <p className="text-xs text-muted-foreground">Click to change file</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Drop your resume here or click to browse</p>
                  <p className="text-xs text-muted-foreground">PDF, DOCX, TXT supported</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}