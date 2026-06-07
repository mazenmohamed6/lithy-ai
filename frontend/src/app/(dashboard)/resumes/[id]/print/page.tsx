"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ResumeTemplate } from "@/components/resume/ResumeTemplate";
import { API_BASE_URL } from "@/lib/constants";

export default function PrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [resume, setResume] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [printState, setPrintState] = useState<'idle' | 'loading' | 'printing' | 'done'>('idle');

  useEffect(() => {
    const id = params.id as string;
    if (!id) { setError("Missing resume ID"); return; }
    setPrintState('loading');

    (async () => {
      let token = searchParams.get("token");
      if (!token) {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
      }
      console.log(`[PRINT] Page loaded, id=${id}, token=${token ? 'present' : 'missing'}`);

      if (!token) { setError("Not authenticated"); return; }

      const url = `${API_BASE_URL}/resumes/${id}`;
      console.log(`[PRINT] Fetching resume from ${url}`);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('[PRINT] response status:', response.status);
      console.log('[PRINT] response headers:', [...response.headers.entries()].map(([k,v])=>`${k}:${v}`).join(', '));
      const text = await response.text();
      console.log('[PRINT] raw response body length:', text.length);
      console.log('[PRINT] raw response body:', text.substring(0, 500));

      if (!response.ok) {
        setError(`API error ${response.status}: ${text.substring(0, 200)}`);
        return;
      }
      if (!text) {
        setError(`Empty API response (status ${response.status})`);
        return;
      }
      const data = JSON.parse(text);
      console.log('[PRINT] Resume loaded, templateId=', data.templateId, 'sections=', data.sections?.length);
      setResume(data);
    })();
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

      setPrintState('printing');
      console.log('[PRINT] Calling window.print()');
      window.print();

      if (!cancelled) {
        console.log('[PRINT] Print dialog closed');
        setPrintState('done');
      }
    })();

    return () => { cancelled = true; };
  }, [resume]);

  useEffect(() => {
    const handleAfterPrint = () => {
      console.log('[PRINT] afterprint event');
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const handlePrintClick = useCallback(() => {
    setPrintState('printing');
    window.print();
    setPrintState('done');
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
      {printState !== 'done' && (
        <div style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          {printState === 'printing' && (
            <span style={{ fontSize: 13, color: '#666' }}>Printing...</span>
          )}
          <button onClick={handlePrintClick}
            style={{
              padding: '8px 20px', background: '#3b82f6', color: '#fff',
              border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}>
            {printState === 'idle' || printState === 'loading' ? 'Print' : 'Print Again'}
          </button>
        </div>
      )}
      <ResumeTemplate
        sections={resume.sections}
        title={resume.title}
        templateId={resume.templateId}
      />
    </>
  );
}
