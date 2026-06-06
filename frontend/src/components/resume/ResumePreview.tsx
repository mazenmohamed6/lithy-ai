"use client";

import { ResumeTemplate } from "./ResumeTemplate";

export function ResumePreview({ sections, title, templateId }: { sections: any[]; title: string; templateId?: string }) {
  return <ResumeTemplate sections={sections} title={title} templateId={templateId} />;
}
