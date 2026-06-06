"use client";

export function ResumePreview({ sections, title, templateId }: { sections: any[]; title: string; templateId?: string }) {
  const contact = sections.find((s) => s.id === "contact")?.fields || {};
  const tid = templateId || "default";

  const contactBlock = () => {
    const name = contact.fullName || "Your Name";
    const items = [contact.email, contact.phone, contact.location].filter(Boolean);

    if (tid === "modern") {
      return (
        <div className="res-contact">
          <h1 className="res-name">{name}</h1>
          <div className="res-contact-grid">
            {items.map((item, i) => <span key={i} className="res-contact-chip">{item}</span>)}
          </div>
        </div>
      );
    }
    if (tid === "creative") {
      return (
        <div className="res-header-creative">
          <h1 className="res-name">{name}</h1>
          <p className="res-contact-bar">{items.join("  ·  ")}</p>
        </div>
      );
    }
    if (tid === "minimal") {
      return (
        <div className="res-header-minimal">
          <h1 className="res-name">{name}</h1>
          <p className="res-contact-bar">{items.join("  /  ")}</p>
        </div>
      );
    }
    if (tid === "professional") {
      return (
        <div className="res-header-professional">
          <div className="res-prof-rule-top" />
          <h1 className="res-name">{name}</h1>
          <p className="res-contact-bar">{items.join("  |  ")}</p>
          <div className="res-prof-rule-bottom" />
        </div>
      );
    }
    return (
      <div className="res-header-classic">
        <h1 className="res-name">{name}</h1>
        <p className="res-contact-bar">{items.join("  |  ")}</p>
        <div className="res-classic-rule" />
      </div>
    );
  };

  const renderSection = (section: any) => {
    if (section.id === "contact") return null;
    if (section.enabled === false) return null;

    const SecHeading = tid === "modern" ? (
      <div className="res-sec-header-modern"><span>{section.title}</span></div>
    ) : tid === "creative" ? (
      <div className="res-sec-header-creative"><span className="res-sec-accent" />{section.title}</div>
    ) : tid === "professional" ? (
      <div className="res-sec-header-prof"><span className="res-sec-prof-text">{section.title}</span><span className="res-sec-prof-line" /></div>
    ) : tid === "minimal" ? (
      <div className="res-sec-header-min">{section.title}</div>
    ) : tid === "classic" || tid === "default" ? (
      <div className="res-sec-header-classic"><span className="res-sec-classic-text">{section.title}</span></div>
    ) : (
      <h2 className="text-lg font-semibold border-b mb-2">{section.title}</h2>
    );

    if (section.id === "summary") {
      return section.content ? (
        <div key={section.id}>
          {SecHeading}
          <p className="res-text-body">{section.content}</p>
        </div>
      ) : null;
    }

    if (section.id === "skills") {
      return section.items?.length ? (
        <div key={section.id}>
          {SecHeading}
          <div className="res-skills">{section.items.map((s: string, i: number) => <span key={i} className="res-skill-tag">{s}</span>)}</div>
        </div>
      ) : null;
    }

    if (section.items?.length) {
      return (
        <div key={section.id}>
          {SecHeading}
          {section.items.map((item: any) => (
            <div key={item.id} className="res-item">
              <div className="res-item-header">
                <span className="res-item-title">{item.title || [item.degree, item.field].filter(Boolean).join(', ') || item.rank || item.name || ""}</span>
                <span className="res-item-date">{item.startDate || ""}{item.startDate ? " – " : ""}{item.current ? "Present" : item.endDate || ""}</span>
              </div>
              <div className="res-item-sub">{item.company || item.institution || item.branch || ""}</div>
              {item.description && <p className="res-item-desc">{item.description}</p>}
              {item.gpa && <p className="res-item-desc">GPA: {item.gpa}</p>}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div key={section.id}>
        {SecHeading}
        {section.content && <p className="res-text-body">{section.content}</p>}
        {section.items?.map((item: any) => (
          <div key={item.id} className="res-item">
            <p className="res-item-title">{item.title || item.name}</p>
            {item.description && <p className="res-item-desc">{item.description}</p>}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`res-root res-${tid}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@200;500;600;700;800&display=swap');
        .res-root { max-width: 800px; margin: 0 auto; background: #fff; }

        /* ===== CLASSIC ===== */
        .res-classic, .res-default {
          font-family: 'Georgia', 'Times New Roman', serif;
          color: #2d2d2d;
          line-height: 1.5;
        }
        .res-classic .res-header-classic { text-align: center; margin-bottom: 20px; }
        .res-classic .res-name { font-size: 26px; font-weight: 700; letter-spacing: 1px; color: #1a1a1a; margin-bottom: 4px; }
        .res-classic .res-contact-bar { font-size: 11px; color: #666; letter-spacing: 0.5px; margin-bottom: 10px; }
        .res-classic .res-classic-rule { height: 0; border-top: 2px solid #c9952c; width: 60px; margin: 0 auto; }
        .res-classic .res-sec-header-classic { margin: 16px 0 10px; text-align: center; }
        .res-classic .res-sec-classic-text { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #c9952c; background: #fff; padding: 0 12px; }
        .res-classic .res-sec-header-classic { border-top: 1px solid #ddd; line-height: 0; }
        .res-classic .res-item { margin-bottom: 12px; }
        .res-classic .res-item-header { display: flex; justify-content: space-between; align-items: baseline; }
        .res-classic .res-item-title { font-size: 14px; font-weight: 700; color: #1a1a1a; }
        .res-classic .res-item-date { font-size: 11px; color: #888; font-style: italic; }
        .res-classic .res-item-sub { font-size: 12px; font-weight: 600; color: #c9952c; margin-bottom: 2px; }
        .res-classic .res-item-desc { font-size: 12px; color: #444; margin: 2px 0 0; line-height: 1.5; white-space: pre-line; }
        .res-classic .res-text-body { font-size: 12px; color: #444; line-height: 1.6; white-space: pre-line; }
        .res-classic .res-skills { display: flex; flex-wrap: wrap; gap: 6px; }
        .res-classic .res-skill-tag { font-size: 11px; color: #555; background: #f5f2eb; padding: 3px 10px; border-radius: 2px; }

        /* ===== MODERN ===== */
        .res-modern {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: #1e293b;
          line-height: 1.5;
        }
        .res-modern .res-contact { background: #f1f5f9; border-radius: 10px; padding: 20px 24px; margin-bottom: 20px; }
        .res-modern .res-name { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
        .res-modern .res-contact-grid { display: flex; flex-wrap: wrap; gap: 6px; }
        .res-modern .res-contact-chip { font-size: 12px; color: #475569; background: #fff; padding: 4px 12px; border-radius: 20px; }
        .res-modern .res-sec-header-modern { margin: 18px 0 10px; }
        .res-modern .res-sec-header-modern span { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #3b82f6; }
        .res-modern .res-item { margin-bottom: 12px; padding-left: 14px; border-left: 2px solid #e2e8f0; }
        .res-modern .res-item-header { display: flex; justify-content: space-between; align-items: baseline; }
        .res-modern .res-item-title { font-size: 14px; font-weight: 600; color: #0f172a; }
        .res-modern .res-item-date { font-size: 11px; color: #94a3b8; }
        .res-modern .res-item-sub { font-size: 12px; color: #3b82f6; font-weight: 500; margin-bottom: 2px; }
        .res-modern .res-item-desc { font-size: 12px; color: #475569; margin: 2px 0 0; line-height: 1.5; white-space: pre-line; }
        .res-modern .res-text-body { font-size: 12px; color: #475569; line-height: 1.6; white-space: pre-line; }
        .res-modern .res-skills { display: flex; flex-wrap: wrap; gap: 6px; }
        .res-modern .res-skill-tag { font-size: 11px; color: #1e293b; background: #eef2ff; padding: 4px 12px; border-radius: 6px; font-weight: 500; }

        /* ===== MINIMAL ===== */
        .res-minimal {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #333;
          line-height: 1.5;
        }
        .res-minimal .res-header-minimal { text-align: center; margin-bottom: 24px; }
        .res-minimal .res-name { font-size: 30px; font-weight: 200; letter-spacing: 3px; color: #111; margin-bottom: 6px; text-transform: uppercase; }
        .res-minimal .res-contact-bar { font-size: 10px; color: #999; letter-spacing: 1px; }
        .res-minimal .res-sec-header-min { font-size: 13px; font-weight: 300; text-transform: uppercase; letter-spacing: 3px; color: #888; margin: 20px 0 10px; padding-top: 12px; border-top: 1px solid #eee; }
        .res-minimal .res-item { margin-bottom: 10px; }
        .res-minimal .res-item-header { display: flex; justify-content: space-between; align-items: baseline; }
        .res-minimal .res-item-title { font-size: 13px; font-weight: 500; color: #111; }
        .res-minimal .res-item-date { font-size: 10px; color: #aaa; }
        .res-minimal .res-item-sub { font-size: 11px; color: #666; margin-bottom: 1px; }
        .res-minimal .res-item-desc { font-size: 11px; color: #555; margin: 1px 0 0; line-height: 1.5; white-space: pre-line; }
        .res-minimal .res-text-body { font-size: 12px; color: #555; line-height: 1.7; white-space: pre-line; }
        .res-minimal .res-skills { display: flex; flex-wrap: wrap; gap: 4px; }
        .res-minimal .res-skill-tag { font-size: 10px; color: #666; padding: 2px 8px; border: 1px solid #eee; letter-spacing: 0.5px; }

        /* ===== PROFESSIONAL ===== */
        .res-professional {
          font-family: 'Georgia', 'Times New Roman', serif;
          color: #2c3e50;
          line-height: 1.5;
        }
        .res-professional .res-header-professional {
          text-align: center;
          margin-bottom: 20px;
          padding: 0 40px;
        }
        .res-professional .res-prof-rule-top {
          width: 100%; height: 2px; background: #1e3a5f; margin-bottom: 12px;
        }
        .res-professional .res-name { font-size: 28px; font-weight: 700; color: #1e3a5f; letter-spacing: 2px; margin-bottom: 4px; text-transform: uppercase; }
        .res-professional .res-contact-bar { font-size: 11px; color: #5a6b7d; letter-spacing: 0.5px; margin-bottom: 10px; }
        .res-professional .res-prof-rule-bottom {
          width: 80px; height: 1px; background: #c9952c; margin: 0 auto;
        }
        .res-professional .res-sec-header-prof { display: flex; align-items: center; gap: 12px; margin: 18px 0 10px; }
        .res-professional .res-sec-prof-text { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #1e3a5f; white-space: nowrap; }
        .res-professional .res-sec-prof-line { flex: 1; height: 1px; background: #1e3a5f; }
        .res-professional .res-item { margin-bottom: 12px; }
        .res-professional .res-item-header { display: flex; justify-content: space-between; align-items: baseline; }
        .res-professional .res-item-title { font-size: 14px; font-weight: 700; color: #1e3a5f; }
        .res-professional .res-item-date { font-size: 11px; color: #7f8c8d; }
        .res-professional .res-item-sub { font-size: 12px; font-weight: 600; color: #c9952c; margin-bottom: 2px; }
        .res-professional .res-item-desc { font-size: 12px; color: #444; margin: 2px 0 0; line-height: 1.5; white-space: pre-line; }
        .res-professional .res-text-body { font-size: 12px; color: #444; line-height: 1.6; white-space: pre-line; }
        .res-professional .res-skills { display: flex; flex-wrap: wrap; gap: 6px; }
        .res-professional .res-skill-tag { font-size: 11px; color: #2c3e50; background: #edf2f7; padding: 3px 10px; }

        /* ===== CREATIVE ===== */
        .res-creative {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: #18181b;
          line-height: 1.5;
        }
        .res-creative .res-header-creative {
          background: linear-gradient(135deg, #f43f5e 0%, #fb7185 50%, #e11d48 100%);
          color: #fff;
          padding: 28px 32px;
          border-radius: 6px;
          margin-bottom: 20px;
          text-align: center;
        }
        .res-creative .res-name { font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 4px; letter-spacing: -0.5px; }
        .res-creative .res-contact-bar { font-size: 12px; color: rgba(255,255,255,0.9); letter-spacing: 0.3px; }
        .res-creative .res-sec-header-creative { display: flex; align-items: center; gap: 10px; margin: 20px 0 10px; }
        .res-creative .res-sec-accent { width: 4px; height: 18px; background: #f43f5e; border-radius: 2px; display: inline-block; }
        .res-creative .res-sec-header-creative span:last-child { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #18181b; }
        .res-creative .res-item { margin-bottom: 10px; background: #fafafa; padding: 12px 14px; border-radius: 6px; border-left: 3px solid #f43f5e; }
        .res-creative .res-item-header { display: flex; justify-content: space-between; align-items: baseline; }
        .res-creative .res-item-title { font-size: 14px; font-weight: 600; color: #18181b; }
        .res-creative .res-item-date { font-size: 11px; color: #71717a; }
        .res-creative .res-item-sub { font-size: 12px; color: #f43f5e; font-weight: 500; margin-bottom: 2px; }
        .res-creative .res-item-desc { font-size: 12px; color: #52525b; margin: 2px 0 0; line-height: 1.5; white-space: pre-line; }
        .res-creative .res-text-body { font-size: 12px; color: #52525b; line-height: 1.6; white-space: pre-line; }
        .res-creative .res-skills { display: flex; flex-wrap: wrap; gap: 6px; }
        .res-creative .res-skill-tag { font-size: 11px; color: #18181b; background: #fce7f3; padding: 4px 12px; border-radius: 20px; font-weight: 500; }
      `}</style>
      {contactBlock()}
      {sections.filter((s) => s.id !== "contact" && s.enabled !== false).map(renderSection)}
    </div>
  );
}
