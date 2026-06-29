"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";

interface ResumeUploadProps {
  onResumeText: (text: string) => void;
  initialText?: string;
}

export function ResumeUpload({ onResumeText, initialText = "" }: ResumeUploadProps) {
  const { t, locale } = useI18n();
  const [text, setText] = useState(initialText);
  const [fileName, setFileName] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(pdf|docx|doc|txt)$/i)) {
      toast.error(locale === "ar" ? "يتم دعم ملفات PDF, DOCX, DOC, TXT فقط" : "Only PDF, DOCX, DOC, and TXT files are supported");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error(locale === "ar" ? "الملف كبير جداً. الحد الأقصى ٢٠ ميجابايت." : "File is too large. Maximum size is 20MB.");
      return;
    }

    setFileName(file.name);
    setIsParsing(true);

    try {
      if (file.name.endsWith(".txt")) {
        const buffer = await file.arrayBuffer();
        const content = new TextDecoder("utf-8").decode(buffer);
        setText(content);
        onResumeText(content);
      } else {
        const formData = new FormData();
        formData.append("file", file);
        const { text: extracted } = await api.upload("/resumes/extract-text", formData);
        setText(extracted);
        onResumeText(extracted);
      }
    } catch (err: any) {
      const details = err?.status ? ` (HTTP ${err.status})` : "";
      const msg = err.message || (locale === "ar" ? "تعذر قراءة الملف" : "Could not read file");
      toast.error(`${msg}${details}`);
      setText(locale === "ar" ? `[تعذر استخراج النص من ${file.name}. ${msg}${details}. يرجى لصق المحتوى يدوياً.]` : `[Could not extract text from ${file.name}. ${msg}${details}. Please paste content manually.]`);
      onResumeText(locale === "ar" ? `[تعذر استخراج النص من ${file.name}. ${msg}${details}. يرجى لصق المحتوى يدوياً.]` : `[Could not extract text from ${file.name}. ${msg}${details}. Please paste content manually.]`);
    } finally {
      setIsParsing(false);
    }
  };

  const clearFile = () => {
    setFileName("");
    setText("");
    onResumeText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-muted-foreground/40 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
        >
          <Upload className="h-4 w-4" />
          {fileName ? (locale === "ar" ? "تغيير الملف" : "Change file") : (locale === "ar" ? "رفع ملف السيرة الذاتية" : "Upload resume file")}
        </button>
        {fileName && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            <FileText className="h-3 w-3" />
            {fileName}
            <button onClick={clearFile} className="hover:text-destructive ml-1">
              <X className="h-3 w-3" />
            </button>
          </span>
        )}
        {isParsing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      <textarea
        className="w-full min-h-[160px] rounded-lg border border-input bg-transparent p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
        value={text}
        onChange={(e) => { setText(e.target.value); onResumeText(e.target.value); }}
        placeholder={fileName ? (locale === "ar" ? "تعديل النص المستخرج..." : "Edit extracted text...") : (locale === "ar" ? "الصق محتوى سيرتك الذاتية هنا، أو ارفع ملفاً أعلاه..." : "Paste your resume content here, or upload a file above...")}
      />
    </div>
  );
}
