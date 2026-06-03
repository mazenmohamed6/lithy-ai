"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  const { t, locale } = useI18n();

  return (
    <div className={`flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 ${locale === "ar" ? "text-right" : ""}`}>
      <div className="text-destructive text-6xl">!</div>
      <h2 className="text-xl font-semibold">{t("errorPage.title")}</h2>
      <p className="text-muted-foreground text-sm max-w-md text-center">{error.message}</p>
      <Button onClick={reset}>{t("errorPage.action")}</Button>
    </div>
  );
}
