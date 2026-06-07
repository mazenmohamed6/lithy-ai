"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ResumeTemplate } from "@/components/resume/ResumeTemplate";
import { API_BASE_URL } from "@/lib/constants";

export default function PrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [resume, setResume] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const id = params.id as string;
    if (!id) { setError("Missing resume ID"); return; }

    (async () => {
      console.log('[PRINT] rendering ResumeTemplate');
      if (typeof document !== "undefined" && document.querySelector('[data-sonner-toaster]')) {
        (document.querySelector('[data-sonner-toaster]') as HTMLElement).style.display = "none";
      }

      let token: string | null = searchParams.get("token");
      console.log('[PRINT] token from URL:', token ? 'present' : 'missing');
      if (!token) {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token ?? null;
        console.log('[PRINT] token from Supabase session:', token ? 'present' : 'still missing');
      }

      if (!token) { setError("Not authenticated"); return; }

      const url = `${API_BASE_URL}/resumes/${id}`;
      console.log('[PRINT] fetching resume:', url);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('[PRINT] resume response status', response.status);

      const text = await response.text();
      console.log('[PRINT] resume data', text.substring(0, 300));

      if (!response.ok) {
        setError(`API error ${response.status}: ${text.substring(0, 200)}`);
        return;
      }
      if (!text) {
        setError(`Empty API response (status ${response.status})`);
        return;
      }
      const data = JSON.parse(text);
      setResume(data);
    })();
  }, [params.id, searchParams]);

  if (error) {
    return <div className="text-red-500 p-4 text-center">{error}</div>;
  }

  if (!resume) {
    return <div className="p-4 text-center text-muted-foreground">Loading resume...</div>;
  }

  return (
    <>
      <style>{`
        header, footer, [data-sonner-toaster] { display: none !important; }
        body { margin: 0; padding: 0 !important; background: #fff; }
        main { padding: 0 !important; max-width: none !important; }
      `}</style>
      <ResumeTemplate
        sections={resume.sections}
        title={resume.title}
        templateId={resume.templateId}
      />
    </>
  );
}
