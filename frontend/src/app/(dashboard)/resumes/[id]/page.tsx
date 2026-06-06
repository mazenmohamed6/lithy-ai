"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useSupabase } from "@/providers/supabase-provider";
import { api } from "@/lib/api";
import { RESUME_SECTIONS, RESUME_TEMPLATES, PLANS } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/context";
import { toast } from "sonner";
import { Loader2, Plus, Eye, Download, Save, Sparkles, GripVertical, Trash2, ArrowLeft, Menu, CheckCircle2, AlertCircle, Lightbulb, Crown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { toSvg } from "dom-to-image-more";
import jsPDF from "jspdf";

export default function ResumeEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useSupabase();
  const { t, locale } = useI18n();
  const [resume, setResume] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">("saved");
  const [activeSection, setActiveSection] = useState<string>("contact");
  const [previewMode, setPreviewMode] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const previewRef = useRef<HTMLDivElement>(null);
  const isNew = params.id === "new";
  const [userPlan, setUserPlan] = useState<string>("FREE");
  const canAccessPremium = userPlan === "PRO" || userPlan === "PREMIUM" || userPlan === "PRO_ANNUAL" || userPlan === "PREMIUM_ANNUAL";

  const templatePreviews = {
    default: {
      style: { fontFamily: "Georgia,serif", background: "#faf8f4" },
      headerStyle: { background: "#fff", padding: "4px 4px 2px", borderBottom: "2px solid #c9952c", textAlign: "center" as const },
      header: <><div style={{fontWeight:700,fontSize:8,color:"#1a1a1a"}}>JOHN DOE</div><div style={{fontSize:5,color:"#888"}}>john@email.com</div></>,
      bodyStyle: { padding: "3px 4px" },
      lineStyle: { height: 3, background: "#ddd", marginTop: 2, borderRadius: 1 },
    },
    modern: {
      style: { fontFamily: "'Inter',sans-serif", background: "#f8fafc" },
      headerStyle: { background: "#f1f5f9", padding: "4px", textAlign: "center" as const },
      header: <><div style={{fontWeight:700,fontSize:8,color:"#0f172a"}}>JOHN DOE</div><div style={{fontSize:5,color:"#3b82f6",marginTop:1}}>john@email.com</div></>,
      bodyStyle: { padding: "3px 4px" },
      lineStyle: { height: 3, background: "#e2e8f0", marginTop: 2, borderRadius: 1, borderLeft: "2px solid #3b82f6" },
    },
    minimal: {
      style: { fontFamily: "'Helvetica Neue',Arial,sans-serif", background: "#fff" },
      headerStyle: { padding: "6px 4px 2px", textAlign: "center" as const },
      header: <><div style={{fontWeight:200,fontSize:9,letterSpacing:1,color:"#111",textTransform:"uppercase"}}>JOHN DOE</div><div style={{fontSize:5,color:"#aaa"}}>john@email.com</div></>,
      bodyStyle: { padding: "3px 4px" },
      lineStyle: { height: 2, background: "#eee", marginTop: 2 },
    },
    professional: {
      style: { fontFamily: "Georgia,serif", background: "#fcfcfc" },
      headerStyle: { padding: "4px", textAlign: "center" as const },
      header: <><div style={{height:2,background:"#1e3a5f",marginBottom:2,marginLeft:12,marginRight:12}} /><div style={{fontWeight:700,fontSize:8,letterSpacing:0.5,color:"#1e3a5f",textTransform:"uppercase"}}>JOHN DOE</div><div style={{fontSize:5,color:"#5a6b7d"}}>john@email.com</div><div style={{width:16,height:1,background:"#c9952c",margin:"2px auto 0"}} /></>,
      bodyStyle: { padding: "3px 4px" },
      lineStyle: { height: 3, background: "#edf2f7", marginTop: 2 },
    },
    creative: {
      style: { fontFamily: "'Inter',sans-serif", background: "#fef9fb" },
      headerStyle: { background: "linear-gradient(135deg,#f43f5e,#e11d48)", padding: "6px 4px", textAlign: "center" as const },
      header: <><div style={{fontWeight:800,fontSize:8,color:"#fff"}}>JOHN DOE</div><div style={{fontSize:5,color:"rgba(255,255,255,.85)"}}>john@email.com</div></>,
      bodyStyle: { padding: "3px 4px" },
      lineStyle: { height: 3, background: "#fce7f3", marginTop: 2, borderRadius: 2 },
    },
  };

  const saveResume = useCallback(async () => {
    setSaveStatus("saving");
    try {
      if (isNew) {
        const created = await api.post("/resumes", { title, sections });
        toast.success(locale === "ar" ? "تم إنشاء السيرة الذاتية!" : "Resume created!");
        router.replace(`/resumes/${created.id}`);
      } else {
        await api.put(`/resumes/${params.id}`, { title, sections, templateId: resume?.templateId });
        setSaveStatus("saved");
      }
    } catch (err: any) {
      toast.error(err.message || (locale === "ar" ? "فشل الحفظ" : "Failed to save"));
      setSaveStatus("unsaved");
    }
  }, [title, sections, isNew, params.id, resume, locale]);

  useEffect(() => {
    if (!user) return;
    api.get("/users/usage").then((u: any) => setUserPlan(u.plan || "FREE")).catch(() => {});
    if (isNew) {
      setSections(getDefaultSections());
      setTitle(locale === "ar" ? "سيرة ذاتية بدون عنوان" : "Untitled Resume");
      setIsLoading(false);
      return;
    }
    api.get(`/resumes/${params.id}`)
      .then((data) => {
        setResume(data);
        setSections(data.sections || []);
        setTitle(data.title || (locale === "ar" ? "سيرة ذاتية بدون عنوان" : "Untitled Resume"));
      })
      .catch(() => toast.error(locale === "ar" ? "فشل تحميل السيرة الذاتية" : "Failed to load resume"))
      .finally(() => setIsLoading(false));
  }, [user, params.id, locale]);

  useEffect(() => {
    if (isNew) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    if (saveStatus === "saving") return;
    setSaveStatus("unsaved");
    autosaveTimer.current = setTimeout(() => {
      if (!isNew) {
        setSaveStatus("saving");
        api.put(`/resumes/${params.id}`, { title, sections, templateId: resume?.templateId })
          .then(() => setSaveStatus("saved"))
          .catch(() => setSaveStatus("unsaved"));
      }
    }, 3000);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [title, sections, resume?.templateId, isNew, params.id]);

  const handleDownloadPdf = useCallback(async () => {
    const card = previewRef.current as HTMLElement | null;
    if (!card) { toast.error("Preview not ready"); return; }
    toast.info("Generating PDF...");
    try {
      await document.fonts.ready;
      const hadMinH = card.classList.contains('min-h-[1000px]');
      const hadPadding = card.classList.contains('p-8');
      if (hadMinH) { card.classList.remove('min-h-[1000px]'); }
      if (hadPadding) { card.classList.remove('p-8'); }

      const svgData = await toSvg(card, { bgcolor: '#fff' });

      if (hadMinH) { card.classList.add('min-h-[1000px]'); }
      if (hadPadding) { card.classList.add('p-8'); }

      const svgImg = new Image();
      svgImg.src = svgData;
      await svgImg.decode();

      const pixelRatio = 2;
      const canvas = document.createElement('canvas');
      canvas.width = svgImg.naturalWidth * pixelRatio;
      canvas.height = svgImg.naturalHeight * pixelRatio;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(svgImg, 0, 0, canvas.width, canvas.height);

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF("p", "mm", "letter");
      const pageW = 215.9;
      const pageH = 279.4;
      const contentW = pageW;
      const ratio = contentW / canvas.width;
      const contentH = canvas.height * ratio;
      let y = 0;
      while (y < contentH) {
        if (y > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -y, contentW, contentH);
        y += pageH;
      }
      pdf.save(`${title || "resume"}.pdf`);
    } catch (err) {
      if (card.classList.contains('min-h-[1000px]') === false) {
        card.classList.add('min-h-[1000px]');
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error("PDF generation failed:", err);
      toast.error(msg);
    }
  }, [title]);

  const getCompletionScore = () => {
    let filled = 0; let total = 0;
    const contact = sections.find((s) => s.id === "contact")?.fields || {};
    if (contact.fullName) filled++; total++;
    if (contact.email) filled++; total++;
    if (contact.phone) filled++; total++;
    const summary = sections.find((s) => s.id === "summary")?.content;
    if (summary && summary.length > 20) filled++; total++;
    const exp = sections.find((s) => s.id === "experience")?.items || [];
    if (exp.length > 0) filled++; total++;
    const edu = sections.find((s) => s.id === "education")?.items || [];
    if (edu.length > 0) filled++; total++;
    const skills = sections.find((s) => s.id === "skills")?.items || [];
    if (skills.length > 0) filled++; total++;
    if (exp.some((e: any) => e.description?.length > 50)) filled++; total++;
    return total > 0 ? Math.round((filled / total) * 100) : 0;
  };

  const getHealthScore = () => {
    const score = getCompletionScore();
    const contact = sections.find((s) => s.id === "contact")?.fields || {};
    const hasLinkedin = !!contact.linkedin;
    if (score >= 85 && hasLinkedin) return { score: 95, label: locale === "ar" ? "ممتاز" : "Excellent", color: "text-green-500" };
    if (score >= 70) return { score: 80, label: locale === "ar" ? "جيد جداً" : "Good", color: "text-blue-500" };
    if (score >= 40) return { score: 55, label: locale === "ar" ? "قيد التحسين" : "Needs Work", color: "text-yellow-500" };
    return { score: 25, label: locale === "ar" ? "يحتاج اهتمام" : "Needs Attention", color: "text-red-500" };
  };

  const updateSection = (sectionId: string, data: any) => {
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, ...data } : s)));
  };

  const addSection = (sectionId: string) => {
    const template = RESUME_SECTIONS.find((s) => s.id === sectionId);
    if (!template) return;
    if (sections.find((s) => s.id === sectionId)) { toast.error(locale === "ar" ? "القسم مضاف بالفعل" : "Section already added"); return; }
    setSections((prev) => [...prev, { id: sectionId, type: sectionId, title: template.label, enabled: true, items: [], content: "", fields: {} }]);
    setActiveSection(sectionId);
  };

  const removeSection = (sectionId: string) => {
    if (["contact", "summary", "experience", "education", "skills"].includes(sectionId)) {
      toast.error(locale === "ar" ? "لا يمكن إزالة قسم أساسي" : "Cannot remove required section");
      return;
    }
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  };

  const moveSection = (index: number, direction: number) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sections.length) return;
    const newSections = [...sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    setSections(newSections);
  };

  const completionScore = getCompletionScore();
  const health = getHealthScore();

  const sectionTips: Record<string, string> = {
    contact: locale === "ar" ? "أضف رابط LinkedIn لزيادة فرصك بنسبة ٧١٪" : "Adding a LinkedIn URL increases your chances by 71%",
    summary: locale === "ar" ? "اكتب فقرة مختصرة من ٣-٤ جمل تسلط الضوء على أهم إنجازاتك" : "Write 3-4 sentences highlighting your top achievements",
    experience: locale === "ar" ? "استخدم أرقاماً وإحصائيات لوصف إنجازاتك. مثلاً: 'زدت المبيعات بنسبة ٣٠٪'" : "Use numbers to describe achievements. E.g. 'Increased sales by 30%'",
    education: locale === "ar" ? "اذكر المعدل التراكمي إذا كان أعلى من ٣.٠ والمقررات الدراسية ذات الصلة" : "Include GPA if above 3.0 and relevant coursework",
    skills: locale === "ar" ? "أضف ٨-١٢ مهارة مقسمة إلى مهارات تقنية وشخصية" : "Add 8-12 skills split into technical and soft skills",
    military: locale === "ar" ? "اذكر فرع الخدمة ورتبتك ومدة الخدمة وأهم الإنجازات" : "Include branch, rank, service period, and key achievements",
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-[400px] bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (previewMode) {
    return (
      <div className="container py-8 print-container">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .res-root, .res-root * { visibility: visible; }
            .res-root { position: absolute; left: 0; top: 0; width: 100%; }
            .print-container { max-width: 100%; padding: 0; }
            @page { margin: 0; size: letter; }
          }
        `}</style>
        <div className="flex items-center justify-between mb-4 no-print">
          <Button variant="ghost" onClick={() => setPreviewMode(false)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Editor
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
            <Download className="mr-2 h-4 w-4" /> Save as PDF
          </Button>
        </div>
        <Card ref={previewRef} className="max-w-[800px] mx-auto min-h-[1000px] p-8 print-card">
          <ResumePreview sections={sections} title={title} templateId={resume?.templateId || "default"} />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className={cn(
        "w-80 border-r bg-muted/30 p-4 overflow-y-auto space-y-4 transition-all duration-200",
        "hidden md:block",
        leftPanelOpen ? "md:w-80" : "md:w-0 md:p-0 md:overflow-hidden",
      )}>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}><ArrowLeft className="h-4 w-4" /></Button>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="font-semibold" />
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase">Sections</p>
          {sections.map((section, index) => (
            <div key={section.id} className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted ${activeSection === section.id ? "bg-muted" : ""}`} onClick={() => setActiveSection(section.id)}>
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              <span className="flex-1 text-sm">{section.title}</span>
              {!["contact", "summary", "experience", "education", "skills"].includes(section.id) && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase">Add Section</p>
          <div className="grid grid-cols-2 gap-1">
            {RESUME_SECTIONS.filter((s) => !sections.find((sec) => sec.id === s.id)).map((section) => (
              <Button key={section.id} variant="outline" size="sm" className="justify-start text-xs" onClick={() => addSection(section.id)}>
                <Plus className="h-3 w-3 mr-1" /> {section.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">Template</p>
          <div className="grid grid-cols-1 gap-2">
            {RESUME_TEMPLATES.map((t) => {
              const locked = t.premium && !canAccessPremium;
              const selected = resume?.templateId === t.id || (isNew && t.id === "default");
              const preview = templatePreviews[t.id as keyof typeof templatePreviews] || templatePreviews.default;
              return (
                <button
                  key={t.id}
                  disabled={locked}
                  onClick={() => {
                    if (locked) { toast.error("Premium templates require a Pro or Premium plan. Upgrade to access this template."); return; }
                    setResume((prev: any) => ({ ...prev, templateId: t.id }));
                  }}
                  className={`relative flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${selected ? "border-primary ring-1 ring-primary bg-primary/5" : "border-border hover:border-primary/50"} ${locked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex-shrink-0 w-14 h-16 rounded overflow-hidden border flex flex-col text-[7px] leading-tight" style={preview.style}>
                    <div style={preview.headerStyle}>{preview.header}</div>
                    <div className="p-1 space-y-0.5" style={preview.bodyStyle}>
                      <div style={preview.lineStyle} />
                      <div style={preview.lineStyle} className="w-3/4" />
                      <div style={preview.lineStyle} className="w-1/2" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{t.name}</span>
                      {t.premium && !locked && <Crown className="h-3 w-3 text-amber-500" />}
                      {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                      {selected && <CheckCircle2 className="h-3 w-3 text-primary ml-auto" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setLeftPanelOpen(!leftPanelOpen)}>
                <Menu className="h-4 w-4" />
              </Button>
              <h2 className="text-lg md:text-xl font-semibold truncate">{sections.find((s) => s.id === activeSection)?.title || (locale === "ar" ? "تعديل القسم" : "Edit Section")}</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className={`size-3.5 ${saveStatus === "saved" ? "text-green-500" : saveStatus === "saving" ? "text-yellow-500 animate-spin" : "text-muted-foreground"}`} />
                  {saveStatus === "saved" ? (locale === "ar" ? "محفوظ" : "Saved") : saveStatus === "saving" ? (locale === "ar" ? "جاري الحفظ..." : "Saving...") : (locale === "ar" ? "تغييرات غير محفوظة" : "Unsaved")}
                </span>
                <span className="text-muted-foreground">|</span>
                <span className="flex items-center gap-1">
                  <span className={`font-semibold ${completionScore >= 80 ? "text-green-500" : completionScore >= 40 ? "text-yellow-500" : "text-red-500"}`}>{completionScore}%</span>
                  {locale === "ar" ? "اكتمال" : "Complete"}
                </span>
                <span className="text-muted-foreground">|</span>
                <span className={`font-semibold ${health.color}`}>{health.label}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPreviewMode(true)} className="hidden sm:inline-flex">
                  <Eye className="mr-1.5 h-3.5 w-3.5" /> {locale === "ar" ? "عرض" : "Preview"}
                </Button>
                <Button size="sm" onClick={saveResume} disabled={saveStatus === "saving"}>
                  <Save className="mr-1.5 h-3.5 w-3.5" /> {saveStatus === "saving" ? "..." : (locale === "ar" ? "حفظ" : "Save")}
                </Button>
              </div>
            </div>
          </div>

          <div className="sm:hidden flex items-center justify-between text-xs px-1 pb-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className={`size-3 ${saveStatus === "saved" ? "text-green-500" : "text-muted-foreground"}`} />
              {saveStatus === "saved" ? (locale === "ar" ? "محفوظ" : "Saved") : (locale === "ar" ? "غير محفوظ" : "Unsaved")}
            </span>
            <span className={`font-semibold ${completionScore >= 80 ? "text-green-500" : completionScore >= 40 ? "text-yellow-500" : "text-red-500"}`}>{completionScore}%</span>
            <span className={health.color}>{health.label}</span>
          </div>

          <div className="md:hidden flex gap-1 overflow-x-auto pb-2 -mx-1 px-1 hide-scrollbar">
            {sections.filter(s => s.enabled !== false).map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {section.title}
              </button>
            ))}
          </div>

          {sectionTips[activeSection] && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs text-muted-foreground">
              <Lightbulb className="size-3.5 text-primary shrink-0 mt-0.5" />
              <span>{sectionTips[activeSection]}</span>
            </div>
          )}

          <div className="h-[1px] bg-border" />

          <SectionEditor sectionId={activeSection} data={sections.find((s) => s.id === activeSection)} onUpdate={updateSection} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-background border-t p-3 flex gap-2 z-40">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => setPreviewMode(true)}>
          <Eye className="mr-1.5 h-3.5 w-3.5" /> {locale === "ar" ? "عرض" : "Preview"}
        </Button>
        <Button size="sm" className="flex-1" onClick={saveResume} disabled={saveStatus === "saving"}>
          <Save className="mr-1.5 h-3.5 w-3.5" /> {saveStatus === "saving" ? "..." : (locale === "ar" ? "حفظ" : "Save")}
        </Button>
      </div>
    </div>
  );
}

function SectionEditor({ sectionId, data, onUpdate }: { sectionId: string; data?: any; onUpdate: (id: string, data: any) => void }) {
  if (!data) return <p className="text-muted-foreground">Select a section to edit</p>;

  switch (sectionId) {
    case "contact":
      return <ContactEditor data={data} onUpdate={(d: any) => onUpdate(sectionId, d)} />;
    case "summary":
      return <SummaryEditor data={data} onUpdate={(d: any) => onUpdate(sectionId, d)} />;
    case "experience":
      return <ExperienceEditor data={data} onUpdate={(d: any) => onUpdate(sectionId, d)} />;
    case "education":
      return <EducationEditor data={data} onUpdate={(d: any) => onUpdate(sectionId, d)} />;
    case "skills":
      return <SkillsEditor data={data} onUpdate={(d: any) => onUpdate(sectionId, d)} />;
    case "military":
      return <MilitaryEditor data={data} onUpdate={(d: any) => onUpdate(sectionId, d)} />;
    default:
      return <GenericEditor data={data} onUpdate={(d: any) => onUpdate(sectionId, d)} />;
  }
}

function ContactEditor({ data, onUpdate }: { data: any; onUpdate: (data: any) => void }) {
  const fields = data.fields || {};
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm font-medium">Full Name</label><Input value={fields.fullName || ""} onChange={(e) => onUpdate({ ...data, fields: { ...fields, fullName: e.target.value } })} /></div>
          <div><label className="text-sm font-medium">Email</label><Input value={fields.email || ""} onChange={(e) => onUpdate({ ...data, fields: { ...fields, email: e.target.value } })} /></div>
          <div><label className="text-sm font-medium">Phone</label><Input value={fields.phone || ""} onChange={(e) => onUpdate({ ...data, fields: { ...fields, phone: e.target.value } })} /></div>
          <div><label className="text-sm font-medium">Location</label><Input value={fields.location || ""} onChange={(e) => onUpdate({ ...data, fields: { ...fields, location: e.target.value } })} /></div>
          <div><label className="text-sm font-medium">LinkedIn URL</label><Input value={fields.linkedin || ""} onChange={(e) => onUpdate({ ...data, fields: { ...fields, linkedin: e.target.value } })} /></div>
          <div><label className="text-sm font-medium">Website</label><Input value={fields.website || ""} onChange={(e) => onUpdate({ ...data, fields: { ...fields, website: e.target.value } })} /></div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryEditor({ data, onUpdate }: { data: any; onUpdate: (data: any) => void }) {
  return (
    <Card>
      <CardContent className="p-6">
        <label className="text-sm font-medium">Professional Summary</label>
        <textarea className="w-full min-h-[120px] mt-2 rounded-md border border-input bg-transparent p-3 text-sm" value={data.content || ""} onChange={(e) => onUpdate({ ...data, content: e.target.value })} placeholder="Write a compelling professional summary..." />
      </CardContent>
    </Card>
  );
}

function ExperienceEditor({ data, onUpdate }: { data: any; onUpdate: (data: any) => void }) {
  const items = data.items || [];
  const addItem = () => onUpdate({ ...data, items: [...items, { id: Date.now().toString(), company: "", title: "", startDate: "", endDate: "", current: false, description: "" }] });
  const updateItem = (id: string, field: string, value: any) => onUpdate({ ...data, items: items.map((i: any) => i.id === id ? { ...i, [field]: value } : i) });
  const removeItem = (id: string) => onUpdate({ ...data, items: items.filter((i: any) => i.id !== id) });

  return (
    <div className="space-y-4">
      {items.map((item: any) => (
        <Card key={item.id}>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between">
              <div className="grid grid-cols-2 gap-3 flex-1">
                <div><label className="text-xs">Company</label><Input value={item.company} onChange={(e) => updateItem(item.id, "company", e.target.value)} /></div>
                <div><label className="text-xs">Job Title</label><Input value={item.title} onChange={(e) => updateItem(item.id, "title", e.target.value)} /></div>
                <div><label className="text-xs">Start Date</label><Input type="month" value={item.startDate} onChange={(e) => updateItem(item.id, "startDate", e.target.value)} /></div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1"><label className="text-xs">End Date</label><Input type="month" value={item.endDate} onChange={(e) => updateItem(item.id, "endDate", e.target.value)} disabled={item.current} /></div>
                  <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={item.current} onChange={(e) => updateItem(item.id, "current", e.target.checked)} /> Current</label>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" onClick={() => removeItem(item.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
            <div><label className="text-xs">Description</label><textarea className="w-full min-h-[80px] mt-1 rounded-md border border-input bg-transparent p-2 text-sm" value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} placeholder="Describe your responsibilities and achievements..." /></div>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}><Plus className="mr-2 h-4 w-4" /> Add Experience</Button>
    </div>
  );
}

function EducationEditor({ data, onUpdate }: { data: any; onUpdate: (data: any) => void }) {
  const items = data.items || [];
  const addItem = () => onUpdate({ ...data, items: [...items, { id: Date.now().toString(), institution: "", degree: "", field: "", startDate: "", endDate: "", gpa: "" }] });
  const updateItem = (id: string, field: string, value: any) => onUpdate({ ...data, items: items.map((i: any) => i.id === id ? { ...i, [field]: value } : i) });
  const removeItem = (id: string) => onUpdate({ ...data, items: items.filter((i: any) => i.id !== id) });

  return (
    <div className="space-y-4">
      {items.map((item: any) => (
        <Card key={item.id}>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs">Institution</label><Input value={item.institution} onChange={(e) => updateItem(item.id, "institution", e.target.value)} /></div>
              <div><label className="text-xs">Degree</label><Input value={item.degree} onChange={(e) => updateItem(item.id, "degree", e.target.value)} /></div>
              <div><label className="text-xs">Field of Study</label><Input value={item.field} onChange={(e) => updateItem(item.id, "field", e.target.value)} /></div>
              <div><label className="text-xs">GPA</label><Input value={item.gpa} onChange={(e) => updateItem(item.id, "gpa", e.target.value)} /></div>
              <div><label className="text-xs">Start Date</label><Input type="month" value={item.startDate} onChange={(e) => updateItem(item.id, "startDate", e.target.value)} /></div>
              <div className="flex gap-2"><div className="flex-1"><label className="text-xs">End Date</label><Input type="month" value={item.endDate} onChange={(e) => updateItem(item.id, "endDate", e.target.value)} /></div><Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="h-3 w-3" /></Button></div>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}><Plus className="mr-2 h-4 w-4" /> Add Education</Button>
    </div>
  );
}

function SkillsEditor({ data, onUpdate }: { data: any; onUpdate: (data: any) => void }) {
  const [input, setInput] = useState("");
  const items = data.items || [];
  const addSkill = () => { if (input.trim()) { onUpdate({ ...data, items: [...items, input.trim()] }); setInput(""); } };
  const removeSkill = (index: number) => onUpdate({ ...data, items: items.filter((_: any, i: number) => i !== index) });

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Add a skill..." onKeyDown={(e) => e.key === "Enter" && addSkill()} />
          <Button variant="outline" onClick={addSkill}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((skill: string, index: number) => (
            <span key={index} className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm">
              {skill}
              <button onClick={() => removeSkill(index)} className="hover:text-destructive">&times;</button>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MilitaryEditor({ data, onUpdate }: { data: any; onUpdate: (data: any) => void }) {
  const items = data.items || [];
  const addItem = () => onUpdate({ ...data, items: [...items, { id: Date.now().toString(), branch: "", rank: "", startDate: "", endDate: "", description: "" }] });
  const updateItem = (id: string, field: string, value: any) => onUpdate({ ...data, items: items.map((i: any) => i.id === id ? { ...i, [field]: value } : i) });
  const removeItem = (id: string) => onUpdate({ ...data, items: items.filter((i: any) => i.id !== id) });

  return (
    <div className="space-y-4">
      {items.map((item: any) => (
        <Card key={item.id}>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between">
              <div className="grid grid-cols-2 gap-3 flex-1">
                <div><label className="text-xs">Branch</label><Input value={item.branch} onChange={(e) => updateItem(item.id, "branch", e.target.value)} /></div>
                <div><label className="text-xs">Rank</label><Input value={item.rank} onChange={(e) => updateItem(item.id, "rank", e.target.value)} /></div>
                <div><label className="text-xs">Start Date</label><Input type="month" value={item.startDate} onChange={(e) => updateItem(item.id, "startDate", e.target.value)} /></div>
                <div className="flex gap-2">
                  <div className="flex-1"><label className="text-xs">End Date</label><Input type="month" value={item.endDate} onChange={(e) => updateItem(item.id, "endDate", e.target.value)} /></div>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>
            <div><label className="text-xs">Description</label><textarea className="w-full min-h-[80px] mt-1 rounded-md border border-input bg-transparent p-2 text-sm" value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} placeholder="Describe your service, achievements, and responsibilities..." /></div>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}><Plus className="mr-2 h-4 w-4" /> Add Service Entry</Button>
    </div>
  );
}

function GenericEditor({ data, onUpdate }: { data: any; onUpdate: (data: any) => void }) {
  const items = data.items || [];
  const addItem = () => onUpdate({ ...data, items: [...items, { id: Date.now().toString(), title: "", subtitle: "", description: "" }] });
  const updateItem = (id: string, field: string, value: any) => onUpdate({ ...data, items: items.map((i: any) => i.id === id ? { ...i, [field]: value } : i) });
  const removeItem = (id: string) => onUpdate({ ...data, items: items.filter((i: any) => i.id !== id) });

  return (
    <div className="space-y-4">
      {items.map((item: any) => (
        <Card key={item.id}>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between gap-3">
              <div className="flex-1"><label className="text-xs">Title</label><Input value={item.title} onChange={(e) => updateItem(item.id, "title", e.target.value)} /></div>
              <div className="flex-1"><label className="text-xs">Subtitle</label><Input value={item.subtitle} onChange={(e) => updateItem(item.id, "subtitle", e.target.value)} /></div>
              <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
            <div><label className="text-xs">Description</label><textarea className="w-full min-h-[60px] mt-1 rounded-md border border-input bg-transparent p-2 text-sm" value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} /></div>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}><Plus className="mr-2 h-4 w-4" /> Add Item</Button>
    </div>
  );
}

function getDefaultSections() {
  return [
    { id: "contact", type: "contact", title: "Contact", enabled: true, fields: {} },
    { id: "summary", type: "summary", title: "Professional Summary", enabled: true, content: "" },
    { id: "experience", type: "experience", title: "Experience", enabled: true, items: [] },
    { id: "education", type: "education", title: "Education", enabled: true, items: [] },
    { id: "skills", type: "skills", title: "Skills", enabled: true, items: [] },
    { id: "certifications", type: "certifications", title: "Certifications", enabled: true, items: [] },
    { id: "languages", type: "languages", title: "Languages", enabled: true, items: [] },
    { id: "projects", type: "projects", title: "Projects", enabled: true, items: [] },
    { id: "references", type: "references", title: "References", enabled: true, items: [] },
    { id: "publications", type: "publications", title: "Publications", enabled: true, items: [] },
    { id: "volunteer", type: "volunteer", title: "Volunteer Experience", enabled: true, items: [] },
    { id: "awards", type: "awards", title: "Awards", enabled: true, items: [] },
    { id: "patents", type: "patents", title: "Patents", enabled: true, items: [] },
    { id: "military", type: "military", title: "Military Service", enabled: true, items: [] },
    { id: "hobbies", type: "hobbies", title: "Hobbies", enabled: true, items: [] },
  ];
}
