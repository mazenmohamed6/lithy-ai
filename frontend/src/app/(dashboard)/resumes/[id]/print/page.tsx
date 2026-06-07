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
    const token = searchParams.get("token");
    const id = params.id as string;
    console.log(`[PrintPage] token=${token ? 'present' : 'missing'}, id=${id}`);
    if (!token) { setError("Missing auth token"); return; }
    if (!id) { setError("Missing resume ID"); return; }

    const url = `${API_BASE_URL}/resumes/${id}`;
    console.log(`[PrintPage] fetching ${url}`);
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`API error: ${r.status}`);
        console.log('[PrintPage] fetch OK, parsing JSON...');
        return r.json();
      })
      .then((data) => {
        console.log('[PrintPage] resume data received, templateId=', data.templateId);
        setResume(data);
      })
      .catch((e) => {
        console.error('[PrintPage] fetch error:', e.message);
        setError(e.message);
      });
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
        body { margin: 0; padding: 0 !important; }
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
