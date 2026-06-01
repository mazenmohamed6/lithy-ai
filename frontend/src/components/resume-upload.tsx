"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";

interface ResumeUploadProps {
  onResumeText: (text: string) => void;
  initialText?: string;
}

export function ResumeUpload({ onResumeText, initialText = "" }: ResumeUploadProps) {
  const [text, setText] = useState(initialText);
  const [fileName, setFileName] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(pdf|docx|doc|txt)$/i)) return;

    setFileName(file.name);
    setIsParsing(true);

    try {
      const buffer = await file.arrayBuffer();
      let content = "";

      if (file.name.endsWith(".txt")) {
        content = new TextDecoder("utf-8").decode(buffer);
      } else {
        content = `[Uploaded: ${file.name} — ${(file.size / 1024).toFixed(1)}KB]`;
        const textFromBuffer = new TextDecoder("utf-8").decode(buffer.slice(0, 10000));
        const cleaned = textFromBuffer.replace(/[^\x20-\x7E\n\r]/g, "").trim();
        if (cleaned.length > 50) content = cleaned;
      }

      setText(content);
      onResumeText(content);
    } catch {
      setText(`[Uploaded file: ${file.name}]`);
      onResumeText(`[Uploaded file: ${file.name}]`);
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
          {fileName ? "Change file" : "Upload resume file"}
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
        placeholder={fileName ? "Edit extracted text..." : "Paste your resume content here, or upload a file above..."}
      />
    </div>
  );
}
