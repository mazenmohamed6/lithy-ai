"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { Loader2 } from "lucide-react";

export default function ResumePrintPage() {
  const params = useParams();
  const [resume, setResume] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/resumes/${params.id}`)
      .then((data) => {
        setResume(data);
        setLoading(false);
        setTimeout(() => window.print(), 300);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!resume) {
    return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Resume not found</div>;
  }

  return (
    <div className="print-page">
      <style>{`
        body { margin: 0; padding: 32px; background: white; }
        .print-page { max-width: 800px; margin: 0 auto; }
        @media print {
          body { padding: 0; }
          .print-page { max-width: 100%; }
          @page { margin: 0.75in; size: letter; }
        }
        .no-print { display: block; text-align: center; margin-bottom: 16px; }
        @media print { .no-print { display: none; } }
      `}</style>
      <div className="no-print">
        <p style={{ color: '#666', fontSize: 14, fontFamily: 'system-ui' }}>
          Use <strong>Ctrl+P</strong> (or <strong>Cmd+P</strong>) to save as PDF.
          Select &ldquo;Save as PDF&rdquo; as the destination.
        </p>
      </div>
      <ResumePreview sections={resume.sections} title={resume.title} templateId={resume.templateId} />
    </div>
  );
}
