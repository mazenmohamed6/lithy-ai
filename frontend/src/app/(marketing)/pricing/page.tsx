"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, Sparkles, Shield, ChevronDown } from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/context";

const FEATURE_LABELS: Record<string, { en: string; ar: string }> = {
  maxResumes: { en: "Resumes", ar: "السير الذاتية" },
  aiGenerations: { en: "AI resume generations", ar: "توليد بالذكاء الاصطناعي" },
  atsScans: { en: "ATS score analysis", ar: "تحليل درجة ATS" },
  jobMatches: { en: "Job match analysis", ar: "تحليل تطابق الوظائف" },
  templates: { en: "Templates", ar: "القوالب" },
  pdfExport: { en: "PDF export", ar: "تصدير PDF" },
  pdfBranding: { en: "White-label PDF", ar: "PDF بدون علامة مائية" },
  coverLetters: { en: "Cover letter generation", ar: "إنشاء خطابات التقديم" },
  analytics: { en: "Analytics dashboard", ar: "لوحة التحليلات" },
  prioritySupport: { en: "Priority support", ar: "دعم ذو أولوية" },
  linkedinOptimizer: { en: "LinkedIn profile optimizer", ar: "تحسين ملف LinkedIn" },
};

function formatFeatureValue(key: string, value: any): string {
  if (value === -1 || value === 999) return "Unlimited";
  if (value === true) return "✓";
  if (value === false) return "—";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value.charAt(0).toUpperCase() + value.slice(1);
  return String(value);
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { t, locale } = useI18n();

  useEffect(() => {
    fetch(`${API_BASE_URL}/subscriptions/plans`)
      .then((r) => r.json())
      .then((data) => {
        setPlans(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const freePlan = plans.find((p) => p.name === "FREE");
  const paidMonthly = plans
    .filter((p) => p.interval === "month" && p.name !== "FREE" && p.isActive !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const paidAnnual = plans
    .filter((p) => p.interval === "year" && p.isActive !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const displayedPlans = [freePlan, ...(annual ? paidAnnual : paidMonthly)].filter(Boolean);
  const planHref = (plan: any) => `/signup?plan=${plan.name.toLowerCase()}`;
  const rawFaq = t("faq.items");
  const faqItems = (typeof rawFaq === "string" ? [] : rawFaq) as unknown as { q: string; a: string }[];

  return (
    <div className="py-24 md:py-32">
      <div className="container text-center max-w-3xl mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-muted/50 text-sm text-muted-foreground mb-6">
          <Sparkles className="size-3.5 text-primary" />
          <span>{locale === "ar" ? "أسعار تناسب الجميع" : "Pricing for everyone"}</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("pricing.title")}</h1>
        <p className="text-lg text-muted-foreground mb-8">{t("pricing.subtitle")}</p>
        <div className="flex items-center justify-center gap-4">
          <span className={cn("text-sm", !annual && "font-semibold")}>{t("pricing.monthly")}</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", annual ? "bg-primary" : "bg-muted")}
          >
            <span className={cn("inline-block h-4 w-4 rounded-full bg-white transition-transform", annual ? "translate-x-6" : "translate-x-1")} />
          </button>
          <span className={cn("text-sm", annual && "font-semibold")}>
            {t("pricing.yearly")} <span className="text-green-600">{t("pricing.saveUpTo")}</span>
          </span>
        </div>
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Shield className="size-3.5 text-green-500" /> {t("pricing.trial")}</span>
          <span className="flex items-center gap-1.5"><Check className="size-3.5 text-green-500" /> {t("pricing.cancelAnytime")}</span>
        </div>
      </div>

      <div className="container grid md:grid-cols-3 gap-8 max-w-5xl mb-16">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-muted-foreground">
            {locale === "ar" ? "جاري تحميل الخطط..." : "Loading plans..."}
          </div>
        ) : (
          displayedPlans.map((plan, idx) => {
            const features = plan.features || {};
            const isPopular = idx === 1;
            const isFree = plan.priceEgp === 0;
            const isAnnual = plan.interval === "year";
            const monthlyPrice = isAnnual && plan.priceEgp > 0 ? Math.round(plan.priceEgp / 12) : null;

            const planName = isFree ? t("pricing.free.name") : plan.name === "PRO" ? t("pricing.pro.name") : plan.name === "PREMIUM" ? t("pricing.premium.name") : plan.name;
            const planDesc = isFree ? t("pricing.free.desc") : plan.name === "PRO" ? t("pricing.pro.desc") : plan.name === "PREMIUM" ? t("pricing.premium.desc") : plan.description;

            return (
              <Card key={plan.id} className={cn("relative flex flex-col card-hover", isPopular && "border-primary shadow-lg glow scale-[1.02]")}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-primary text-primary-foreground shadow-sm px-4 py-1">{t("pricing.popular")}</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{planName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{planDesc}</p>
                  <div className="mt-4">
                    {isFree ? (
                      <div className="text-4xl font-bold">{t("pricing.free.price")}</div>
                    ) : (
                      <>
                        <div className="text-4xl font-bold">{plan.priceEgp} <span className="text-base font-normal text-muted-foreground">{locale === "ar" ? `ج/${isAnnual ? "سنة" : "شهر"}` : `EGP/${isAnnual ? "yr" : "mo"}`}</span></div>
                        {monthlyPrice && <div className="text-sm text-muted-foreground mt-1">{locale === "ar" ? `~${monthlyPrice} ج/شهر` : `~${monthlyPrice} EGP/month`}</div>}
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {Object.entries(FEATURE_LABELS).map(([key, cfg]) => {
                      const value = features[key];
                      if (value === undefined) return null;
                      const hasFeature = value !== false && value !== 0 && value !== "—";
                      return (
                        <li key={key} className="flex items-start gap-2 text-sm">
                          <Check className={cn("h-4 w-4 mt-0.5 shrink-0", hasFeature ? "text-primary" : "text-muted-foreground/30")} />
                          <span className={cn(hasFeature ? "" : "text-muted-foreground/50")}>
                            {locale === "ar" ? cfg.ar : cfg.en}
                            {value !== true ? `: ${formatFeatureValue(key, value)}` : ""}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href={planHref(plan)} className="w-full">
                    <Button className="w-full" variant={isPopular ? "default" : "outline"} size="lg">
                      {t("pricing.cta")}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>

      <div className="container max-w-2xl">
        <h2 className="text-2xl font-bold text-center mb-8">{t("faq.title")}</h2>
        <div className="space-y-3">
          {faqItems.map((item, i) => (
            <div key={i} className="rounded-xl border bg-card overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium text-sm">{item.q}</span>
                <ChevronDown className={cn("size-4 text-muted-foreground transition-transform shrink-0", openFaq === i && "rotate-180")} />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-sm text-muted-foreground border-t pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
