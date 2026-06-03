"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";
import { useSupabase } from "@/providers/supabase-provider";
import { APP_NAME, APP_URL } from "@/lib/constants";
import { Gift, Share2, Copy, Check, Users, Award, Star, Link2, TrendingUp, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ReferralPage() {
  const { t, locale } = useI18n();
  const { user } = useSupabase();
  const [copied, setCopied] = useState("");

  const referralCode = user?.id?.slice(0, 8) || "guest";
  const referralLink = `${APP_URL}/signup?ref=${referralCode}`;

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast.success(t("referral.copied"));
      setTimeout(() => setCopied(""), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }, [t]);

  const shareVia = (platform: string) => {
    const text = locale === "ar"
      ? `انشئ سيرتك الذاتية الاحترافية مع ${APP_NAME} - منصة الذكاء الاصطناعي للتوظيف في مصر والمنطقة العربية`
      : `Build your professional resume with ${APP_NAME} - AI-powered career platform for Egypt and the MENA region`;
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + referralLink)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`,
    };
    window.open(urls[platform], "_blank", "noopener,noreferrer,width=600,height=400");
  };

  const rewards = [
    { icon: Gift, title: t("referral.reward1"), desc: t("referral.reward1Desc") },
    { icon: Star, title: t("referral.reward2"), desc: t("referral.reward2Desc") },
    { icon: Award, title: t("referral.reward3"), desc: t("referral.reward3Desc") },
  ];

  const steps = [
    { step: 1, text: t("referral.step1") },
    { step: 2, text: t("referral.step2") },
    { step: 3, text: t("referral.step3") },
  ];

  return (
    <div className="container py-16 space-y-16 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-primary/10 mb-2">
          <Gift className="size-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">{t("referral.title")}</h1>
        <p className="text-lg text-muted-foreground">{t("referral.subtitle")}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="size-5" />
              {t("referral.yourLink")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border text-sm break-all">
              <span className="text-muted-foreground">{referralLink}</span>
            </div>
            <Button className="w-full gap-2" onClick={() => copyToClipboard(referralLink, "link")}>
              {copied === "link" ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied === "link" ? t("referral.copied") : t("referral.copyLink")}
            </Button>
            <div>
              <p className="text-sm font-medium mb-3">{t("referral.shareVia")}</p>
              <div className="flex gap-2">
                {[
                  { id: "whatsapp", label: "WhatsApp", color: "hover:bg-green-500/10 hover:text-green-600" },
                  { id: "facebook", label: "Facebook", color: "hover:bg-blue-500/10 hover:text-blue-600" },
                  { id: "twitter", label: "X", color: "hover:bg-gray-500/10 hover:text-gray-600" },
                  { id: "telegram", label: "Telegram", color: "hover:bg-sky-500/10 hover:text-sky-600" },
                ].map((platform) => (
                  <Button key={platform.id} variant="outline" size="sm" onClick={() => shareVia(platform.id)} className={`gap-2 ${platform.color}`}>
                    <Share2 className="size-3.5" />
                    {platform.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="size-5" />
              {t("referral.stats")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: t("referral.totalReferrals"), value: "0", icon: Users, color: "text-blue-500" },
                { label: t("referral.activeReferrals"), value: "0", icon: CheckCircle2, color: "text-green-500" },
                { label: t("referral.rewardsEarned"), value: "0", icon: Award, color: "text-purple-500" },
              ].map((stat) => {
                const StatIcon = stat.icon;
                return (
                  <div key={stat.label} className="space-y-1">
                    <StatIcon className={`size-5 mx-auto ${stat.color}`} />
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                );
              })}
            </div>
            {!user && (
              <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-center text-muted-foreground">
                {locale === "ar" ? "سجل الدخول لتتبع إحالاتك" : "Sign in to track your referrals"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t("referral.shareTitle")}</h2>
          <p className="text-muted-foreground">{t("referral.shareDesc")}</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {rewards.map((reward) => {
            const Icon = reward.icon;
            return (
              <Card key={reward.title} className="card-hover text-center">
                <CardContent className="pt-6">
                  <div className="inline-flex items-center justify-center size-12 rounded-xl bg-primary/5 mb-4">
                    <Icon className="size-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{reward.title}</h3>
                  <p className="text-sm text-muted-foreground">{reward.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-center mb-8">{t("referral.steps")}</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-6 sm:gap-0">
            {steps.map((s, i) => (
              <div key={s.step} className="flex items-center gap-4 sm:flex-col sm:text-center flex-1 relative">
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-6 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px border-t border-dashed border-muted-foreground/30" />
                )}
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 relative z-10">
                  <span className="text-lg font-bold text-primary">{s.step}</span>
                </div>
                <p className="text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
