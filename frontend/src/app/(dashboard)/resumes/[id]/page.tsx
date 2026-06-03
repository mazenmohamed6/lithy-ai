"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useSupabase } from "@/providers/supabase-provider";
import { api } from "@/lib/api";
import { RESUME_SECTIONS, RESUME_TEMPLATES } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/context";
import { toast } from "sonner";
import { Loader2, Plus, Eye, Download, Save, Sparkles, GripVertical, Trash2, ArrowLeft, Menu, CheckCircle2, AlertCircle, Lightbulb, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const isNew = params.id === "new";

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
  }, [title, sections, isNew, params.id]);

  const handleDownload = useCallback(async () => {
    if (!isNew && params.id) {
      try {
        await api.download(`/resumes/${params.id}/download-pdf`);
      } catch {
        toast.info(locale === "ar" ? "جاري فتح خيار الطباعة..." : "Opening print dialog...");
        setTimeout(() => window.print(), 500);
      }
    } else {
      window.print();
    }
  }, [isNew, params.id, locale]);

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
      <div className="container py-8">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => setPreviewMode(false)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Editor
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" /> Save as PDF
          </Button>
        </div>
        <Card className="max-w-[800px] mx-auto min-h-[1000px] p-8">
          <ResumePreview sections={sections} title={title} />
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

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase">Template</p>
          <div className="grid grid-cols-2 gap-2">
            {RESUME_TEMPLATES.map((t) => (
              <Button key={t.id} variant={resume?.templateId === t.id || (isNew && t.id === "default") ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setResume((prev: any) => ({ ...prev, templateId: t.id }))}>
                {t.name} {t.premium && "★"}
              </Button>
            ))}
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
                {!isNew && (
                  <Button variant="outline" size="sm" onClick={handleDownload} className="hidden sm:inline-flex">
                    <Download className="mr-1.5 h-3.5 w-3.5" /> PDF
                  </Button>
                )}
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
        {!isNew && (
          <Button variant="outline" size="sm" className="flex-1" onClick={handleDownload}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> PDF
          </Button>
        )}
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

function ResumePreview({ sections, title }: { sections: any[]; title: string }) {
  const contact = sections.find((s) => s.id === "contact")?.fields || {};

  const sectionRenderers: Record<string, (section: any) => React.ReactNode> = {
    contact: () => (
      <div className="text-center">
        <h1 className="text-2xl font-bold">{contact.fullName || "Your Name"}</h1>
        <p className="text-sm text-muted-foreground">
          {[contact.email, contact.phone, contact.location].filter(Boolean).join(" | ")}
        </p>
      </div>
    ),
    summary: (s) => s.content ? (
      <div key={s.id}>
        <h2 className="text-lg font-semibold border-b mb-2">{s.title}</h2>
        <p className="text-sm">{s.content}</p>
      </div>
    ) : null,
    experience: (s) => s.items?.length ? (
      <div key={s.id}>
        <h2 className="text-lg font-semibold border-b mb-2">{s.title}</h2>
        {s.items.map((item: any) => (
          <div key={item.id} className="mb-3">
            <div className="flex justify-between"><span className="font-medium">{item.title}</span><span className="text-sm text-muted-foreground">{item.startDate} - {item.current ? "Present" : item.endDate}</span></div>
            <p className="text-sm text-muted-foreground">{item.company}</p>
            <p className="text-sm mt-1">{item.description}</p>
          </div>
        ))}
      </div>
    ) : null,
    education: (s) => s.items?.length ? (
      <div key={s.id}>
        <h2 className="text-lg font-semibold border-b mb-2">{s.title}</h2>
        {s.items.map((item: any) => (
          <div key={item.id} className="mb-2">
            <div className="flex justify-between"><span className="font-medium">{item.degree} in {item.field}</span><span className="text-sm text-muted-foreground">{item.startDate} - {item.endDate}</span></div>
            <p className="text-sm text-muted-foreground">{item.institution}{item.gpa ? ` | GPA: ${item.gpa}` : ""}</p>
          </div>
        ))}
      </div>
    ) : null,
    skills: (s) => s.items?.length ? (
      <div key={s.id}>
        <h2 className="text-lg font-semibold border-b mb-2">{s.title}</h2>
        <p className="text-sm">{s.items.join(" • ")}</p>
      </div>
    ) : null,
  };

  return (
    <div className="space-y-6">
      {contact.fullName && sectionRenderers.contact(sections.find((s) => s.id === "contact")!)}
      {sections.filter((s) => s.id !== "contact" && s.enabled !== false).map((section) => {
        const renderer = sectionRenderers[section.id];
        return renderer ? renderer(section) : (
          <div key={section.id}>
            <h2 className="text-lg font-semibold border-b mb-2">{section.title}</h2>
            {section.content && <p className="text-sm">{section.content}</p>}
            {section.items?.map((item: any) => (
              <div key={item.id} className="mb-2">
                <p className="text-sm font-medium">{item.title || item.name}</p>
                {item.description && <p className="text-sm">{item.description}</p>}
              </div>
            ))}
          </div>
        );
      })}
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
    { id: "hobbies", type: "hobbies", title: "Hobbies", enabled: true, items: [] },
  ];
}
