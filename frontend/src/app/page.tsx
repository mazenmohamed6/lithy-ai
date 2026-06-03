"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { ArrowRight, Check, Sparkles, Star, Shield, Key, Lock, CreditCard, FileText, Quote, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

export default function LandingPage() {
  const { t, locale } = useI18n();
  const quotes = t("quotes") as unknown as string[];
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setQuoteIndex((i) => (i + 1) % quotes.length), 5000);
    return () => clearInterval(interval);
  }, [quotes.length]);

  return (
    <div className="flex flex-col">
      <HeroSection t={t} locale={locale} />
      <QuoteSection quote={quotes[quoteIndex]} />
      <SocialProofSection t={t} />
      <FeaturesSection t={t} />
      <ComparisonSection t={t} locale={locale} />
      <EgyptSection t={t} />
      <SuccessSection t={t} locale={locale} />
      <TestimonialsSection />
      <TrustSection t={t} />
      <CTASection t={t} locale={locale} />
    </div>
  );
}

function AnimatedCounter({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <div ref={ref} className="text-3xl md:text-4xl font-bold gradient-text">
      {count.toLocaleString()}{suffix}
    </div>
  );
}

function HeroSection({ t, locale }: { t: any; locale: string }) {
  return (
    <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-4 size-96 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-4 size-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 size-[500px] bg-primary/3 rounded-full blur-3xl" />
      </div>
      <div className="container text-center max-w-5xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm font-medium mb-6 animate-fade-in">
          <span className="size-2 rounded-full bg-red-500 animate-pulse-soft" />
          {t("hero.problem")}
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6 animate-fade-in-up">
          {t("hero.title")}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed animate-fade-in-up">
          {t("hero.subtitle")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up">
          <Link href="/signup">
            <Button size="lg" className="text-base px-8 h-12 shadow-lg glow gap-2">
              {t("hero.cta")}
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="text-base px-8 h-12 gap-2">
            <Play className="size-4" />
            {t("hero.ctaSecondary")}
          </Button>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground animate-fade-in">
          <Shield className="size-4 text-green-500" />
          <span>{t("hero.trust")}</span>
        </div>
      </div>
    </section>
  );
}

function QuoteSection({ quote }: { quote: string }) {
  return (
    <section className="py-10 border-y bg-muted/20">
      <div className="container text-center max-w-3xl">
        <Quote className="size-5 text-primary/40 mx-auto mb-3" />
        <p className="text-base md:text-lg font-medium text-muted-foreground italic leading-relaxed">
          &ldquo;{quote}&rdquo;
        </p>
      </div>
    </section>
  );
}

function SocialProofSection({ t }: { t: any }) {
  return (
    <section className="py-20 md:py-28">
      <div className="container max-w-5xl text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-12">{t("social.title")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <div className="p-6 rounded-xl bg-card border card-hover">
            <AnimatedCounter target={2500} suffix="+" />
            <div className="text-sm text-muted-foreground mt-2">{t("social.resumes")}</div>
          </div>
          <div className="p-6 rounded-xl bg-card border card-hover">
            <AnimatedCounter target={8500} suffix="+" />
            <div className="text-sm text-muted-foreground mt-2">{t("social.atsScans")}</div>
          </div>
          <div className="p-6 rounded-xl bg-card border card-hover">
            <AnimatedCounter target={1200} suffix="+" />
            <div className="text-sm text-muted-foreground mt-2">{t("social.interviews")}</div>
          </div>
          <div className="p-6 rounded-xl bg-card border card-hover">
            <AnimatedCounter target={15} suffix="+" />
            <div className="text-sm text-muted-foreground mt-2">{t("social.universities")}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection({ t }: { t: any }) {
  const featuresData = t("features.items") as Record<string, { title: string; desc: string }>;
  const featureIcons: Record<string, any> = {
    aiBuilder: Sparkles, atsScanner: FileText, coverLetters: FileText,
    jobMatch: ArrowRight, linkedin: Sparkles, bilingual: Sparkles,
  };

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container max-w-6xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("features.title")}</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">{t("features.subtitle")}</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(featuresData).map(([key, feature], i) => {
            const Icon = featureIcons[key] || Sparkles;
            return (
              <div key={key} className="group card-hover rounded-xl border bg-card p-6">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="size-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const competitors = [
  { name: "LITHY AI", isBest: true, features: { arabic: true, english: true, atsAnalysis: true, aiGeneration: true, jdMatching: true, pdfExport: true, localOptimization: true } },
  { name: "Resume.io", isBest: false, features: { arabic: false, english: true, atsAnalysis: true, aiGeneration: true, jdMatching: false, pdfExport: "Limited", localOptimization: false } },
  { name: "Rezi", isBest: false, features: { arabic: false, english: true, atsAnalysis: true, aiGeneration: true, jdMatching: true, pdfExport: true, localOptimization: false } },
  { name: "Zety", isBest: false, features: { arabic: false, english: true, atsAnalysis: false, aiGeneration: true, jdMatching: false, pdfExport: false, localOptimization: false } },
];

function ComparisonSection({ t, locale }: { t: any; locale: string }) {
  const features = t("comparison.features") as Record<string, string>;

  return (
    <section className="py-20 md:py-28">
      <div className="container max-w-5xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("comparison.title")}</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">{t("comparison.subtitle")}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground" />
                {competitors.map((c) => (
                  <th key={c.name} className={`p-4 text-center font-semibold ${c.isBest ? "text-primary" : ""}`}>
                    <div className="flex flex-col items-center gap-1">
                      {c.isBest && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t("comparison.bestValue")}</span>}
                      <span>{c.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(features).map((key, i) => (
                <tr key={key} className={`border-t ${i % 2 === 0 ? "bg-muted/20" : ""}`}>
                  <td className="p-4 text-sm font-medium">{features[key]}</td>
                  {competitors.map((c) => {
                    const val = c.features[key as keyof typeof c.features];
                    return (
                      <td key={c.name} className="p-4 text-center">
                        {val === true ? <Check className="size-5 text-green-500 mx-auto" /> : val === false ? <span className="text-muted-foreground/40">—</span> : <span className="text-sm text-muted-foreground">{val}</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function EgyptSection({ t }: { t: any }) {
  const items = t("egypt.items") as Record<string, { title: string; desc: string }>;

  return (
    <section className="py-20 md:py-28 bg-muted/30 border-y">
      <div className="container max-w-6xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("egypt.title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("egypt.subtitle")}</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(items).map(([key, item]) => (
            <div key={key} className="flex gap-4 p-5 rounded-xl border bg-card card-hover">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SuccessSection({ t, locale }: { t: any; locale: string }) {
  const stories = [
    { before: 52, after: 91, name: locale === "ar" ? "أحمد" : "Ahmed", role: locale === "ar" ? "مهندس برمجيات" : "Software Engineer" },
    { before: 38, after: 87, name: locale === "ar" ? "مريم" : "Mariam", role: locale === "ar" ? "محللة بيانات" : "Data Analyst" },
    { before: 45, after: 83, name: locale === "ar" ? "يوسف" : "Youssef", role: locale === "ar" ? "محاسب" : "Accountant" },
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="container max-w-6xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("success.title")}</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">{t("success.subtitle")}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {stories.map((story) => {
            const improvement = story.after - story.before;
            return (
              <div key={story.name} className="rounded-xl border bg-card p-6 card-hover">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    {story.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{story.name}</div>
                    <div className="text-xs text-muted-foreground">{story.role}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{t("success.beforeLabel")}</span>
                      <span className="font-semibold text-muted-foreground">{story.before}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-muted-foreground/30" style={{ width: `${story.before}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{t("success.afterLabel")}</span>
                      <span className="font-semibold text-green-600">{story.after}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-green-500" style={{ width: `${story.after}%` }} />
                    </div>
                  </div>
                  <div className="text-center pt-2 text-sm font-medium text-primary">
                    +{improvement}% {t("success.atsScore")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  { name: "Ahmed Hassan", role: "Software Engineer", company: "Vodafone Egypt", rating: 5, text: "LITHY AI helped me land my dream job at a multinational company. The ATS scanner showed me exactly what was missing in my resume.", initial: "A" },
  { name: "Mariam El-Sayed", role: "Marketing Specialist", company: "Cairo University Graduate", rating: 5, text: "I applied to 20+ jobs with my old resume and got zero responses. After using LITHY AI, I got 3 interview invitations in the first week.", initial: "M" },
  { name: "Youssef Ibrahim", role: "Fresh Graduate", company: "Ain Shams University", rating: 5, text: "As a fresh graduate, I had no idea how to write a professional resume. LITHY AI made it incredibly easy and the results speak for themselves.", initial: "Y" },
  { name: "Nour Ali", role: "Data Analyst", company: "Egyptian Ministry", rating: 4, text: "The bilingual resume feature is a game-changer. I can apply to both local and international companies with one platform.", initial: "N" },
  { name: "Karim Mahmoud", role: "Accountant", company: "PwC Egypt", rating: 5, text: "The job match analysis helped me tailor my resume for each application. Highly recommend for serious job seekers.", initial: "K" },
];

function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const next = useCallback(() => setActiveIndex((i) => (i + 1) % testimonials.length), []);
  const prev = useCallback(() => setActiveIndex((i) => (i - 1 + testimonials.length) % testimonials.length), []);

  useEffect(() => {
    const interval = setInterval(next, 4000);
    return () => clearInterval(interval);
  }, [next]);

  return (
    <section className="py-20 md:py-28 bg-muted/30 border-y">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">Success Stories</h2>
          <p className="text-muted-foreground">From Egyptian graduates and professionals who transformed their careers</p>
        </div>
        <div className="relative overflow-hidden">
          <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
            {testimonials.map((t, i) => (
              <div key={i} className="min-w-full px-4">
                <div className="rounded-xl border bg-card p-8 text-center mx-auto max-w-xl card-hover">
                  <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-xl font-bold text-primary">
                    {t.initial}
                  </div>
                  <div className="flex justify-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className={`size-4 ${s < t.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-muted-foreground">{t.role} — {t.company}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-3 mt-6">
            <Button variant="outline" size="icon" className="rounded-full size-9" onClick={prev}>
              <ChevronLeft className="size-4" />
            </Button>
            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setActiveIndex(i)} className={`size-2 rounded-full transition-all ${i === activeIndex ? "bg-primary w-6" : "bg-muted-foreground/30"}`} />
              ))}
            </div>
            <Button variant="outline" size="icon" className="rounded-full size-9" onClick={next}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

const trustItems = ["auth", "gdpr", "payments", "encryption"] as const;
const trustIcons: Record<string, any> = {
  auth: Key, gdpr: Shield, payments: CreditCard, encryption: Lock,
};

function TrustSection({ t }: { t: any }) {
  return (
    <section className="py-20 md:py-28">
      <div className="container max-w-5xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("trust.title")}</h2>
        <p className="text-lg text-muted-foreground mb-12 max-w-xl mx-auto">{t("trust.subtitle")}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustItems.map((key) => {
            const Icon = trustIcons[key];
            return (
              <div key={key} className="p-6 rounded-xl border bg-card card-hover">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="size-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1 text-sm">{t(`trust.${key}.title`)}</h3>
                <p className="text-xs text-muted-foreground">{t(`trust.${key}.desc`)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CTASection({ t, locale }: { t: any; locale: string }) {
  return (
    <section className="py-24 md:py-32 bg-muted/30 border-t">
      <div className="container text-center max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("cta.title")}</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">{t("cta.subtitle")}</p>
        <div className="flex flex-col items-center gap-3">
          <Link href="/signup">
            <Button size="lg" className="text-base px-10 h-12 shadow-lg glow gap-2">
              {t("cta.button")}
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Shield className="size-3.5 text-green-500" /> {locale === "ar" ? "نسخة تجريبية مجانية لمدة ٧ أيام" : "7-Day Free Trial"}</span>
            <span className="flex items-center gap-1.5"><Check className="size-3.5 text-green-500" /> {locale === "ar" ? "إلغاء في أي وقت" : "Cancel Anytime"}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
