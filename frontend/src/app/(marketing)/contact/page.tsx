"use client";

import { useI18n } from "@/lib/i18n/context";

export default function ContactPage() {
  const { t, locale } = useI18n();

  const contacts = [
    { key: "support", email: "support@lithyai.com" },
    { key: "press", email: "press@lithyai.com" },
    { key: "partnerships", email: "partners@lithyai.com" },
    { key: "legal", email: "legal@lithyai.com" },
  ];

  return (
    <div className={`py-24 ${locale === "ar" ? "text-right" : ""}`}>
      <div className="container max-w-3xl">
        <h1 className="text-4xl font-bold mb-2 text-center">{t("contact.title")}</h1>
        <p className="text-muted-foreground mb-12 text-center">{t("contact.subtitle")}</p>
        <div className="grid md:grid-cols-2 gap-8">
          {contacts.map((c) => (
            <div key={c.key} className="border rounded-xl p-6">
              <h3 className="font-semibold mb-2">{t(`contact.${c.key}`)}</h3>
              <p className="text-sm text-muted-foreground">{t(`contact.${c.key}Desc`)}</p>
              <p className="text-sm mt-2 text-primary">{c.email}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
