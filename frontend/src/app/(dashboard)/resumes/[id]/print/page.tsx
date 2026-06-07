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
    console.log(`[PRINT] Page loaded, token=${token ? 'present' : 'missing'}, id=${id}`);
    if (!token) { setError("Missing auth token"); return; }
    if (!id) { setError("Missing resume ID"); return; }

    const url = `${API_BASE_URL}/resumes/${id}`;
    console.log(`[PRINT] Fetching resume from ${url}`);
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`API error: ${r.status}`);
        console.log('[PRINT] Fetch OK, parsing JSON...');
        return r.json();
      })
      .then((data) => {
        console.log('[PRINT] Resume loaded, templateId=', data.templateId, 'sections=', data.sections?.length);
        setResume(data);
      })
      .catch((e) => {
        console.error('[PRINT] Fetch error:', e.message);
        setError(e.message);
      });
  }, [params.id, searchParams]);

  useEffect(() => {
    if (!resume) return;
    let cancelled = false;

    (async () => {
      console.log('[PRINT] Resume loaded, waiting for DOM render...');

      while (!document.querySelector('.res-root')) {
        await new Promise(r => setTimeout(r, 50));
        if (cancelled) return;
      }
      const rootEl = document.querySelector('.res-root')!;
      console.log('[PRINT] ResumeTemplate rendered (.res-root found)');
      console.log('[PRINT] .res-root children:', rootEl.children.length);
      console.log('[PRINT] .res-root innerHTML length:', rootEl.innerHTML.length);

      await document.fonts.ready;
      console.log('[PRINT] Fonts ready');

      await new Promise(r => requestAnimationFrame(r));
      await new Promise(r => requestAnimationFrame(r));
      if (cancelled) return;

      console.log('[PRINT] Calling window.print()');
      window.print();
    })();

    return () => { cancelled = true; };
  }, [resume]);

  useEffect(() => {
    const handleAfterPrint = () => {
      console.log('[PRINT] Print dialog closed, closing tab');
      window.close();
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

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
