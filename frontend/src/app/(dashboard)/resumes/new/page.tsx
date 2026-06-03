"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { Loader2, Sparkles, FileText, Upload } from "lucide-react";

export default function NewResumePage() {
  const { t, locale } = useI18n();
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(t("newResume.enterTitle"));
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
      toast.error(t("newResume.enterTitle"));
      return;
    }
    setIsGenerating(true);
    try {
      const resume = await api.post("/resumes", { title: `${title.trim()} - AI Generated` });
      await api.post("/ai/generate-resume", { resumeId: resume.id, jobTitle: title });
      router.push(`/resumes/${resume.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate resume");
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.(pdf|docx|doc|txt)$/i)) {
      toast.error(locale === "ar" ? "فقط ملفات PDF, DOCX, TXT مدعومة" : "Only PDF, DOCX, and TXT files are supported");
      return;
    }
    setFileName(file.name);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const resume = await api.upload("/resumes/upload", formData);
      toast.success(locale === "ar" ? "تم رفع السيرة الذاتية بنجاح!" : "Resume uploaded successfully!");
      router.push(`/resumes/${resume.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload resume");
      setIsUploading(false);
    }
  };

  return (
    <div className={`container py-8 max-w-2xl ${locale === "ar" ? "text-right" : ""}`}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("newResume.title")}</h1>
        <p className="text-muted-foreground">{t("newResume.subtitle")}</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("newResume.details")}</CardTitle>
            <CardDescription>{t("newResume.detailsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t("newResume.resumeTitle")}</Label>
                <Input id="title" placeholder={t("newResume.placeholder")} value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className={`flex gap-3 ${locale === "ar" ? "flex-row-reverse" : ""}`}>
                <Button type="submit" disabled={isCreating || isGenerating || isUploading} className="gap-2">
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  {t("newResume.create")}
                </Button>
                <Button type="button" variant="secondary" disabled={isCreating || isGenerating || isUploading} onClick={handleGenerateWithAI} className="gap-2">
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {t("newResume.generateAI")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("newResume.upload")}</CardTitle>
            <CardDescription>{t("newResume.uploadDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => fileInputRef.current?.click()}>
              <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt" className="hidden" onChange={handleFileUpload} />
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{t("newResume.uploading")} {fileName}...</p>
                </div>
              ) : fileName ? (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-primary" />
                  <p className="text-sm font-medium">{fileName}</p>
                  <p className="text-xs text-muted-foreground">{t("newResume.clickChange")}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">{t("newResume.dropHere")}</p>
                  <p className="text-xs text-muted-foreground">{t("newResume.supported")}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
