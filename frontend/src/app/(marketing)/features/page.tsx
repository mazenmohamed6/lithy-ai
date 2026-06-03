"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { Sparkles, Upload, BarChart3, Target, FileText, Linkedin, Palette, Download } from "lucide-react";

const iconMap: Record<string, any> = {
  aiBuilder: Sparkles,
  atsScanner: BarChart3,
  coverLetters: FileText,
  jobMatch: Target,
  linkedin: Linkedin,
  bilingual: Palette,
};

const extraFeatures = [
  { key: "upload", icon: Upload, color: "text-green-500" },
  { key: "pdfExport", icon: Download, color: "text-teal-500" },
];

export default function FeaturesPage() {
  const { t, locale } = useI18n();
  const featureKeys = ["aiBuilder", "atsScanner", "coverLetters", "jobMatch", "linkedin", "bilingual"];

  return (
    <div className={`py-24 ${locale === "ar" ? "text-right" : ""}`}>
      <div className="container text-center max-w-3xl mb-16">
        <h1 className="text-4xl font-bold mb-4">{t("features.title")}</h1>
        <p className="text-lg text-muted-foreground">{t("features.subtitle")}</p>
      </div>
      <div className="container grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl">
        {featureKeys.map((key) => {
          const item = t(`features.items.${key}.title`);
          const desc = t(`features.items.${key}.desc`);
          const Icon = iconMap[key] || FileText;
          return (
            <div key={key} className="border rounded-xl p-6 hover:shadow-md transition-shadow">
              <Icon className="h-10 w-10 mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">{item}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          );
        })}
        {extraFeatures.map((feat) => {
          const Icon = feat.icon;
          return (
            <div key={feat.key} className="border rounded-xl p-6 hover:shadow-md transition-shadow">
              <Icon className={`h-10 w-10 mb-4 ${feat.color}`} />
              <h3 className="text-lg font-semibold mb-2 capitalize">{feat.key.replace(/([A-Z])/g, ' $1').trim()}</h3>
              <p className="text-sm text-muted-foreground">
                {feat.key === "upload" ? (locale === "ar" ? "ارفع سيرتك الذاتية بصيغة PDF أو DOCX أو صورة ممسوحة ضوئياً. نقوم باستخراج بياناتك وتنظيمها." : "Upload your existing resume in PDF, DOCX, or even a scanned image. We extract and structure your data.") : ""}
                {feat.key === "pdfExport" ? (locale === "ar" ? "صدر سير ذاتية احترافية بصيغة PDF. الخطط المجانية تتضمن علامة تجارية، والخطط المدفوعة تحصل على تصدير بدون علامة تجارية." : "Export clean, professional PDFs. Free plans include branding; paid plans get white-label exports.") : ""}
              </p>
            </div>
          );
        })}
      </div>
      <div className="container text-center mt-16">
        <Link href="/signup">
          <Button size="lg">{t("about.cta")}</Button>
        </Link>
      </div>
    </div>
  );
}
