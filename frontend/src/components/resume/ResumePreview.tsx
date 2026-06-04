"use client";

export function ResumePreview({ sections, title, templateId }: { sections: any[]; title: string; templateId?: string }) {
  const contact = sections.find((s) => s.id === "contact")?.fields || {};
  const tid = templateId || "default";

  const sectionRenderers: Record<string, (section: any) => React.ReactNode> = {
    contact: () => tid === "modern" ? (
      <div className="contact-info">
        <h1>{contact.fullName || "Your Name"}</h1>
        <p className="contact-text">{contact.email || ""}</p>
        <p className="contact-text">{contact.phone || ""}</p>
        <p className="contact-text">{contact.location || ""}</p>
      </div>
    ) : tid === "creative" ? (
      <div className="creative-header">
        <h1>{contact.fullName || "Your Name"}</h1>
        <p>{[contact.email, contact.phone, contact.location].filter(Boolean).join(" | ")}</p>
      </div>
    ) : (
      <div className="text-center">
        <h1 className={`${tid === "professional" ? "" : "text-2xl"} font-bold`}>{contact.fullName || "Your Name"}</h1>
        <p className={`text-sm ${tid === "professional" ? "contact-text" : "text-muted-foreground"}`}>
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
    military: (s) => s.items?.length ? (
      <div key={s.id}>
        <h2 className="text-lg font-semibold border-b mb-2">{s.title}</h2>
        {s.items.map((item: any) => (
          <div key={item.id} className="mb-2">
            <div className="flex justify-between"><span className="font-medium">{item.rank} - {item.branch}</span><span className="text-sm text-muted-foreground">{item.startDate} - {item.endDate}</span></div>
            <p className="text-sm mt-1">{item.description}</p>
          </div>
        ))}
      </div>
    ) : null,
  };

  const templateClass = tid === "modern" ? "template-modern" : tid === "minimal" ? "template-minimal" : tid === "professional" ? "template-professional" : tid === "creative" ? "template-creative" : "";

  return (
    <div className={`space-y-6 resume-preview ${templateClass}`}>
      <style>{`
        .template-modern { font-family: 'Inter', system-ui, sans-serif; }
        .template-modern .contact-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 16px; background: #f8fafc; border-radius: 8px; margin-bottom: 16px; }
        .template-modern .contact-info h1 { font-size: 20px; font-weight: 700; grid-column: 1 / -1; }
        .template-modern h2 { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border: none; margin-bottom: 8px; }
        .template-modern .section-content { padding-left: 8px; border-left: 2px solid #e2e8f0; }
        .template-modern .item { margin-bottom: 12px; }
        .template-minimal { font-family: 'Georgia', serif; }
        .template-minimal h1 { font-size: 28px; font-weight: 400; letter-spacing: 0.02em; }
        .template-minimal .contact-text { font-size: 13px; color: #888; }
        .template-minimal h2 { font-size: 16px; font-weight: 400; border-bottom: 1px solid #ddd; padding-bottom: 2px; margin-bottom: 12px; }
        .template-minimal .item { margin-bottom: 10px; }
        .template-minimal .item strong { font-weight: 500; }
        .template-professional { font-family: 'Times New Roman', serif; }
        .template-professional h1 { font-size: 26px; font-weight: 700; color: #1a365d; }
        .template-professional .contact-text { font-size: 13px; color: #2d3748; }
        .template-professional h2 { font-size: 16px; font-weight: 700; color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 4px; margin-bottom: 12px; }
        .template-professional .item { margin-bottom: 12px; }
        .template-creative { font-family: 'Inter', system-ui, sans-serif; }
        .template-creative .creative-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 8px; margin-bottom: 16px; }
        .template-creative .creative-header h1 { font-size: 24px; font-weight: 700; color: white; }
        .template-creative .creative-header p { color: rgba(255,255,255,0.85); }
        .template-creative h2 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #667eea; border: none; margin-bottom: 8px; }
        .template-creative .item { background: #fafafa; padding: 8px 12px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #667eea; }
      `}</style>
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
