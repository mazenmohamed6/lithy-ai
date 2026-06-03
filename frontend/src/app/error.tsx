"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t, locale } = useI18n();

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${locale === "ar" ? "text-right" : ""}`}>
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-muted-foreground">{t("errorPage.title")}</h1>
        <p className="text-muted-foreground max-w-md">{t("errorPage.message")}</p>
        <Button onClick={reset}>{t("errorPage.action")}</Button>
      </div>
    </div>
  );
}
