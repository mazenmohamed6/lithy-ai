"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

export default function AboutPage() {
  const { t, locale } = useI18n();

  return (
    <div className={`py-24 ${locale === "ar" ? "text-right" : ""}`}>
      <div className="container max-w-3xl text-center">
        <h1 className="text-4xl font-bold mb-4">{t("about.title")}</h1>
        <p className="text-lg text-muted-foreground mb-12">{t("about.subtitle")}</p>
        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div className="border rounded-xl p-6">
            <h3 className="font-semibold mb-2">{t("about.mission")}</h3>
            <p className="text-sm text-muted-foreground">{t("about.missionDesc")}</p>
          </div>
          <div className="border rounded-xl p-6">
            <h3 className="font-semibold mb-2">{t("about.team")}</h3>
            <p className="text-sm text-muted-foreground">{t("about.teamDesc")}</p>
          </div>
          <div className="border rounded-xl p-6">
            <h3 className="font-semibold mb-2">{t("about.values")}</h3>
            <p className="text-sm text-muted-foreground">{t("about.valuesDesc")}</p>
          </div>
        </div>
        <div className="mt-12">
          <Link href="/signup">
            <Button size="lg">{t("about.cta")}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
