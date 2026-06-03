"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";

export type Locale = "en" | "ar";

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dir: "ltr" | "rtl";
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null;
    if (stored === "ar" || stored === "en") setLocaleState(stored);
    else {
      const browserLang = navigator.language?.startsWith("ar") ? "ar" : "en";
      setLocaleState(browserLang);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const dir = locale === "ar" ? "rtl" : "ltr";

  const t = useCallback((key: string): string => {
    const keys = key.split(".");
    let val: any = locale === "ar" ? ar : en;
    for (const k of keys) {
      if (val && typeof val === "object" && k in val) val = val[k];
      else return key;
    }
    return typeof val === "string" ? val : key;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, dir, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

const en = {
  nav: {
    features: "Features",
    pricing: "Pricing",
    blog: "Blog",
    about: "About",
    dashboard: "Dashboard",
    signIn: "Sign In",
    getStarted: "Get Started Free",
    language: "Language",
  },
  hero: {
    problem: "75% of resumes are rejected before a recruiter sees them.",
    title: "Build ATS-Optimized Resumes That Get More Interviews.",
    subtitle: "LITHY AI helps students, graduates, and professionals create ATS-friendly resumes, optimize for job descriptions, and increase interview opportunities.",
    cta: "Start Free",
    ctaSecondary: "Watch Demo",
    trust: "Trusted by 5,000+ job seekers across Egypt",
  },
  features: {
    title: "Everything You Need to Succeed",
    subtitle: "Powerful AI tools designed for Egypt's job market",
    items: {
      aiBuilder: {
        title: "AI Resume Builder",
        desc: "Generate professional resumes from your experience in seconds. Tailored for the Egyptian and MENA job market.",
      },
      atsScanner: {
        title: "ATS Score Analysis",
        desc: "Check your resume against ATS algorithms used by top companies in Egypt and the region.",
      },
      coverLetters: {
        title: "Cover Letters",
        desc: "Create tailored cover letters in both English and Arabic that complement your resume.",
      },
      jobMatch: {
        title: "Job Match Analysis",
        desc: "See how your resume matches job descriptions and fill the gaps to get more interviews.",
      },
      linkedin: {
        title: "LinkedIn Optimizer",
        desc: "Optimize your LinkedIn profile for recruiter searches in the MENA region.",
      },
      bilingual: {
        title: "Bilingual Resumes",
        desc: "Create resumes in English, Arabic, or both. Perfect for Egypt's bilingual job market.",
      },
    },
  },
  social: {
    title: "Trusted by Job Seekers Across Egypt",
    resumes: "Resumes Generated",
    atsScans: "ATS Scans Performed",
    interviews: "Interview Success Stories",
    universities: "Universities Reached",
  },
  comparison: {
    title: "How We Compare",
    subtitle: "See why LITHY AI is the best choice for Egyptian and MENA job seekers",
    features: {
      arabic: "Arabic Support",
      english: "English Support",
      atsAnalysis: "ATS Analysis",
      aiGeneration: "AI Resume Generation",
      jdMatching: "JD Matching",
      pdfExport: "Free PDF Export",
      localOptimization: "Egypt/MENA Local Optimization",
    },
    bestValue: "Best Value",
  },
  egypt: {
    title: "Built for Egypt & the MENA Region",
    subtitle: "LITHY AI is the only platform designed specifically for the Egyptian and Arab job market",
    items: {
      bilingual: { title: "Arabic & English Bilingual", desc: "Create resumes in both languages to appeal to all employers in the region." },
      rtl: { title: "Full RTL Support", desc: "Arabic resumes with proper right-to-left formatting that looks professional." },
      wuzzuf: { title: "Optimized for Wuzzuf", desc: "Resumes formatted to match Wuzzuf's preferred structure and ATS system." },
      bayt: { title: "Optimized for Bayt", desc: "Compatible with Bayt.net's application requirements and parsing algorithms." },
      local: { title: "Local Hiring Standards", desc: "Built around Egyptian labor market norms, degree requirements, and CV expectations." },
      pricing: { title: "Affordable Local Pricing", desc: "Priced in EGP and designed for Egyptian professionals and students." },
    },
  },
  testimonials: {
    title: "Success Stories",
    subtitle: "From Egyptian graduates and professionals who transformed their careers",
  },
  success: {
    title: "Real Results, Real Careers",
    subtitle: "See how LITHY AI improved real resume scores",
    beforeLabel: "Before",
    afterLabel: "After",
    atsScore: "ATS Score",
  },
  trust: {
    title: "Your Data is Safe with Us",
    subtitle: "Enterprise-grade security for your career documents",
    auth: { title: "Secure Authentication", desc: "Protected by Supabase Auth with encrypted sessions." },
    gdpr: { title: "GDPR-Compliant Storage", desc: "Your data is stored securely in compliance with GDPR regulations." },
    payments: { title: "Stripe Secure Payments", desc: "All payments are processed securely through Stripe." },
    encryption: { title: "Encrypted Data", desc: "All documents and personal data are encrypted at rest and in transit." },
  },
  cta: {
    title: "Ready to Land Your Dream Job?",
    subtitle: "Join thousands of Egyptian professionals who built their careers with LITHY AI.",
    button: "Start Building Free — No Credit Card Required",
  },
  how: {
    title: "How It Works",
    subtitle: "Build a professional resume in three simple steps",
    steps: [
      { title: "Tell Us About Yourself", desc: "Enter your experience, education, and skills. Or upload an existing resume and let AI extract everything." },
      { title: "AI Optimizes Your Resume", desc: "Our AI analyzes your content, suggests improvements, and optimizes for ATS systems used by top companies." },
      { title: "Download & Apply", desc: "Export a professional PDF resume, check your ATS score, and start applying with confidence." },
    ],
  },
  demo: {
    title: "See LITHY AI in Action",
    subtitle: "Watch how our AI transforms a basic resume into an ATS-optimized career document in seconds",
    cta: "Try It Free",
    stats: "Average ATS score improvement of 67%",
  },
  atsEducation: {
    title: "What is ATS and Why Does It Matter?",
    subtitle: "Over 75% of large companies use Applicant Tracking Systems to filter resumes before a human ever sees them.",
    fact1: "75% of resumes are rejected by ATS before reaching a recruiter.",
    fact2: "Recruiters spend an average of 7.4 seconds scanning a resume.",
    fact3: "ATS-optimized resumes get 3x more interview callbacks.",
    fact4: "Only 25% of job seekers tailor their resume for each application.",
    cta: "Check Your ATS Score Free",
  },
  quotes: [
    "Every successful career starts with a single application.",
    "Your future employer is looking for someone exactly like you.",
    "A resume is not a document — it's your first impression.",
    "Hard work creates opportunities that luck cannot.",
    "The best time to build your resume was yesterday. The second best time is now.",
  ],
  footer: {
    product: "Product",
    company: "Company",
    legal: "Legal",
    description: "AI-Powered Career Platform for Egypt and the MENA region.",
    copyright: "All rights reserved.",
  },
  pricing: {
    title: "Simple, Transparent Pricing",
    subtitle: "Choose the plan that fits your career goals. All plans include a 7-day free trial.",
    monthly: "Monthly",
    yearly: "Yearly",
    saveUpTo: "Save up to 20%",
    trial: "7-Day Free Trial",
    cancelAnytime: "Cancel Anytime",
    moneyBack: "30-Day Money-Back Guarantee",
    free: {
      name: "Free",
      desc: "Get started with basic resume building tools",
      price: "0",
    },
    pro: {
      name: "Pro",
      desc: "For serious job seekers who want to stand out",
      price: "75",
    },
    premium: {
      name: "Premium",
      desc: "The ultimate career acceleration toolkit",
      price: "150",
    },
    cta: "Get Started",
    features: {
      aiGenerations: "AI Generations",
      atsScans: "ATS Scans",
      jobMatches: "Job Matches",
      maxResumes: "Max Resumes",
      unlimited: "Unlimited",
    },
    popular: "Most Popular",
  },
  faq: {
    title: "Frequently Asked Questions",
    items: [
      { q: "How does the free trial work?", a: "You get full access to all Pro features for 7 days. No credit card required for the Free plan. If you choose a paid plan, you'll be charged after the trial ends." },
      { q: "Can I switch plans later?", a: "Yes, you can upgrade or downgrade at any time. Changes take effect immediately." },
      { q: "Is my data secure?", a: "Absolutely. We use enterprise-grade encryption and GDPR-compliant storage. Your documents are private and secure." },
      { q: "Do you support Arabic resumes?", a: "Yes! LITHY AI fully supports Arabic and bilingual resumes with proper RTL formatting." },
      { q: "What payment methods do you accept?", a: "We accept all major credit cards and debit cards through Stripe. Prices are in EGP." },
      { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time. You'll still have access until the end of your billing period." },
    ],
  },
  dashboard: {
    title: "Dashboard",
    welcome: "Welcome back",
    newResume: "New Resume",
    resumeCompletion: "Resume Completion",
    atsImprovement: "ATS Improvement",
    aiUsage: "AI Usage Remaining",
    subscription: "Subscription",
    recentActivity: "Recent Activity",
    quickActions: "Quick Actions",
    careerProgress: "Career Progress",
    coach: {
      greeting: "Ready to take your career to the next level?",
      tip1: "Tip: Use the ATS Scanner to optimize your resume before applying.",
      tip2: "Tip: A tailored cover letter increases interview chances by 40%.",
      tip3: "Did you know? Recruiters spend an average of 7 seconds scanning a resume.",
    },
    createResumeAI: "Create Resume with AI",
    analyzeATS: "Analyze ATS Score",
    checkJobMatch: "Check Job Match",
    generateCoverLetter: "Generate Cover Letter",
  },
  empty: {
    noResumes: "Let's create your first professional resume.",
    noResumesDesc: "Start with a blank template, upload an existing one, or let AI generate one for you.",
    createResume: "Create Resume",
    uploadResume: "Upload Resume",
    generateAI: "Generate with AI",
  },
  auth: {
    welcomeBack: "Welcome Back",
    signInTo: "Sign in to your LITHY AI account",
    signIn: "Sign In",
    signingIn: "Signing in...",
    orContinueWith: "Or continue with",
    forgotPassword: "Forgot password?",
    noAccount: "Don't have an account?",
    signUp: "Sign up",
    createAccount: "Create Your Account",
    startBuilding: "Start building your professional resume with LITHY AI",
    creating: "Creating account...",
    alreadyHaveAccount: "Already have an account?",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    phone: "Phone (optional)",
  },
};

const ar: typeof en = {
  nav: {
    features: "المميزات",
    pricing: "الأسعار",
    blog: "المدونة",
    about: "عن المنصة",
    dashboard: "لوحة التحكم",
    signIn: "تسجيل الدخول",
    getStarted: "ابدأ مجاناً",
    language: "اللغة",
  },
  hero: {
    problem: "٧٥٪ من السير الذاتية يتم رفضها قبل أن يراها مسؤول التوظيف.",
    title: "ابنِ سيرة ذاتية متوافقة مع ATS تحصل على مقابلات أكثر.",
    subtitle: "LITHY AI يساعد الطلاب والخريجين والمحترفين على إنشاء سير ذاتية متوافقة مع ATS، وتحسينها للوصف الوظيفي، وزيادة فرص المقابلات.",
    cta: "ابدأ مجاناً",
    ctaSecondary: "شاهد العرض",
    trust: "موثوق من أكثر من ٥٠٠٠ باحث عن عمل في مصر",
  },
  features: {
    title: "كل ما تحتاجه للنجاح",
    subtitle: "أدوات ذكاء اصطناعي قوية مصممة لسوق العمل المصري",
    items: {
      aiBuilder: {
        title: "منشئ السير الذاتية بالذكاء الاصطناعي",
        desc: "قم بإنشاء سير ذاتية احترافية من خبراتك في ثوانٍ. مصممة خصيصاً لسوق العمل المصري والعربي.",
      },
      atsScanner: {
        title: "تحليل درجة ATS",
        desc: "اختبر سيرتك الذاتية ضد خوارزميات ATS المستخدمة من قبل كبرى الشركات في مصر والمنطقة.",
      },
      coverLetters: {
        title: "خطابات التقديم",
        desc: "أنشئ خطابات تقديم مخصصة باللغتين العربية والإنجليزية تكمل سيرتك الذاتية.",
      },
      jobMatch: {
        title: "تحليل تطابق الوظائف",
        desc: "اكتشف مدى توافق سيرتك الذاتية مع الوصف الوظيفي وسد الفجوات للحصول على مقابلات أكثر.",
      },
      linkedin: {
        title: "تحسين LinkedIn",
        desc: "حسّن ملفك الشخصي على LinkedIn ليظهر في نتائج بحث مسؤولي التوظيف في المنطقة.",
      },
      bilingual: {
        title: "سير ذاتية ثنائية اللغة",
        desc: "أنشئ سير ذاتية بالعربية والإنجليزية أو كلاهما. مثالية لسوق العمل المصري.",
      },
    },
  },
  social: {
    title: "موثوق من الباحثين عن عمل في جميع أنحاء مصر",
    resumes: "سيرة ذاتية منشأة",
    atsScans: "فحص ATS",
    interviews: "قصة نجاح مقابلات",
    universities: "جامعة تم الوصول إليها",
  },
  comparison: {
    title: "مقارنة مع المنافسين",
    subtitle: "اكتشف لماذا LITHY AI هو الخيار الأفضل للباحثين عن عمل في مصر والمنطقة العربية",
    features: {
      arabic: "دعم اللغة العربية",
      english: "دعم اللغة الإنجليزية",
      atsAnalysis: "تحليل ATS",
      aiGeneration: "توليد السيرة بالذكاء الاصطناعي",
      jdMatching: "مطابقة الوصف الوظيفي",
      pdfExport: "تصدير PDF مجاني",
      localOptimization: "تحسين محلي لمصر والمنطقة",
    },
    bestValue: "أفضل قيمة",
  },
  egypt: {
    title: "صممت خصيصاً لمصر والمنطقة العربية",
    subtitle: "LITHY AI هي المنصة الوحيدة المصممة خصيصاً لسوق العمل المصري والعربي",
    items: {
      bilingual: { title: "ثنائية اللغة عربي + إنجليزي", desc: "أنشئ سير ذاتية باللغتين لجذب جميع أصحاب العمل في المنطقة." },
      rtl: { title: "دعم كامل للغة العربية", desc: "سير ذاتية عربية بتنسيق احترافي من اليمين لليسار." },
      wuzzuf: { title: "محسّن لمنصة Wuzzuf", desc: "سير ذاتية متوافقة مع نظام Wuzzuf وهيكله المفضل." },
      bayt: { title: "محسّن لمنصة Bayt", desc: "متوافق مع متطلبات التقديم في Bayt.net وخوارزميات التحليل." },
      local: { title: "معايير التوظيف المحلية", desc: "مبني حول معايير سوق العمل المصري ومتطلبات الشهادات والخبرات." },
      pricing: { title: "أسعار محلية مناسبة", desc: "مسعّر بالجنيه المصري ومصمم للمحترفين والطلاب المصريين." },
    },
  },
  testimonials: {
    title: "قصص نجاح",
    subtitle: "من خريجين ومحترفين مصريين غيروا مسارهم المهني",
  },
  success: {
    title: "نتائج حقيقية، مسيرات مهنية حقيقية",
    subtitle: "شاهد كيف حسّن LITHY AI نتائج سير ذاتية حقيقية",
    beforeLabel: "قبل",
    afterLabel: "بعد",
    atsScore: "درجة ATS",
  },
  trust: {
    title: "بياناتك آمنة معنا",
    subtitle: "أمان على مستوى المؤسسات لوثائقك المهنية",
    auth: { title: "تسجيل دخول آمن", desc: "محمي بواسطة Supabase Auth مع جلسات مشفرة." },
    gdpr: { title: "تخزين متوافق مع GDPR", desc: "يتم تخزين بياناتك بشكل آمن وفقاً للوائح GDPR." },
    payments: { title: "مدفوعات آمنة عبر Stripe", desc: "جميع المدفوعات تتم بشكل آمن عبر Stripe." },
    encryption: { title: "بيانات مشفرة", desc: "جميع المستندات والبيانات الشخصية مشفرة أثناء التخزين والنقل." },
  },
  cta: {
    title: "هل أنت مستعد للحصول على وظيفة أحلامك؟",
    subtitle: "انضم إلى آلاف المحترفين المصريين الذين بنوا مسيرتهم المهنية مع LITHY AI.",
    button: "ابدأ مجاناً — بدون حاجة لبطاقة ائتمان",
  },
  how: {
    title: "كيف يعمل",
    subtitle: "ابنِ سيرتك الذاتية الاحترافية في ثلاث خطوات بسيطة",
    steps: [
      { title: "أخبرنا عن نفسك", desc: "أدخل خبراتك وتعليمك ومهاراتك. أو ارفع سيرة ذاتية موجودة ودع الذكاء الاصطناعي يستخرج كل شيء." },
      { title: "الذكاء الاصطناعي يحسّن سيرتك", desc: "يحلل الذكاء الاصطناعي محتواك، ويقترح تحسينات، ويحسّنها لأنظمة ATS المستخدمة من قبل كبرى الشركات." },
      { title: "حمّل وتقدّم", desc: "صدر سيرة ذاتية احترافية بصيغة PDF، وافحص درجة ATS، وابدأ التقديم بثقة." },
    ],
  },
  demo: {
    title: "شاهد LITHY AI في العمل",
    subtitle: "شاهد كيف يحوّل الذكاء الاصطناعي سيرة ذاتية بسيطة إلى وثيقة مهنية متوافقة مع ATS في ثوانٍ",
    cta: "جربها مجاناً",
    stats: "متوسط تحسن درجة ATS بنسبة ٦٧٪",
  },
  atsEducation: {
    title: "ما هو ATS ولماذا يهمك؟",
    subtitle: "أكثر من ٧٥٪ من الشركات الكبرى تستخدم أنظمة تتبع المتقدمين لفلترة السير الذاتية قبل أن يراها البشر.",
    fact1: "٧٥٪ من السير الذاتية تُرفض بواسطة ATS قبل وصولها لمسؤول التوظيف.",
    fact2: "مسؤولو التوظيف يقضون متوسط ٧.٤ ثانية فقط في مسح السيرة الذاتية.",
    fact3: "السير الذاتية المتوافقة مع ATS تحصل على ٣ أضعاف فرص المقابلات.",
    fact4: "٢٥٪ فقط من الباحثين عن عمل يخصصون سيرتهم الذاتية لكل تقديم.",
    cta: "افحص درجة ATS مجاناً",
  },
  quotes: [
    "كل فرصة عظيمة تبدأ بخطوة واحدة.",
    "النجاح هو نتيجة العمل المستمر وليس ضربة حظ.",
    "سيرتك الذاتية هي أول انطباع عن طموحك.",
    "اجتهد اليوم لتحصد نتائج الغد.",
    "أفضل وقت لبناء سيرتك الذاتية كان البارحة. ثاني أفضل وقت هو الآن.",
  ],
  footer: {
    product: "المنتج",
    company: "الشركة",
    legal: "قانوني",
    description: "منصة مهنية مدعومة بالذكاء الاصطناعي لمصر والمنطقة العربية.",
    copyright: "جميع الحقوق محفوظة.",
  },
  pricing: {
    title: "أسعار بسيطة وشفافة",
    subtitle: "اختر الخطة التي تناسب أهدافك المهنية. جميع الخطط تتضمن نسخة تجريبية مجانية لمدة ٧ أيام.",
    monthly: "شهري",
    yearly: "سنوي",
    saveUpTo: "وفر حتى ٢٠٪",
    trial: "نسخة تجريبية مجانية لمدة ٧ أيام",
    cancelAnytime: "إلغاء في أي وقت",
    moneyBack: "ضمان استعادة الأموال لمدة ٣٠ يوماً",
    free: {
      name: "مجاني",
      desc: "ابدأ بأدوات بناء السيرة الذاتية الأساسية",
      price: "٠",
    },
    pro: {
      name: "احترافي",
      desc: "للباحثين عن عمل جادين الذين يريدون التميز",
      price: "٧٥",
    },
    premium: {
      name: "ممتاز",
      desc: "حزمة التسريع المهني النهائية",
      price: "١٥٠",
    },
    cta: "ابدأ الآن",
    features: {
      aiGenerations: "توليد بالذكاء الاصطناعي",
      atsScans: "فحوصات ATS",
      jobMatches: "تطابق وظيفي",
      maxResumes: "الحد الأقصى للسير الذاتية",
      unlimited: "غير محدود",
    },
    popular: "الأكثر رواجاً",
  },
  faq: {
    title: "الأسئلة الشائعة",
    items: [
      { q: "كيف تعمل النسخة التجريبية المجانية؟", a: "تحصل على وصول كامل لجميع ميزات Pro لمدة ٧ أيام. لا حاجة لبطاقة ائتمان للخطة المجانية. إذا اخترت خطة مدفوعة، سيتم الدفع بعد انتهاء النسخة التجريبية." },
      { q: "هل يمكنني تغيير خطتي لاحقاً؟", a: "نعم، يمكنك الترقية أو التخفيض في أي وقت. التغييرات تسري فوراً." },
      { q: "هل بياناتي آمنة؟", a: "بالتأكيد. نستخدم تشفيراً على مستوى المؤسسات وتخزيناً متوافقاً مع GDPR. مستنداتك خاصة وآمنة." },
      { q: "هل تدعمون السير الذاتية بالعربية؟", a: "نعم! LITHY AI يدعم السير الذاتية العربية وثنائية اللغة بشكل كامل مع تنسيق RTL احترافي." },
      { q: "ما هي طرق الدفع المقبولة؟", a: "نقبل جميع بطاقات الائتمان والخصم الرئيسية عبر Stripe. الأسعار بالجنيه المصري." },
      { q: "هل يمكنني الإلغاء في أي وقت؟", a: "نعم، يمكنك إلغاء اشتراكك في أي وقت. ستبقى لديك صلاحية الوصول حتى نهاية فترة الفوترة." },
    ],
  },
  dashboard: {
    title: "لوحة التحكم",
    welcome: "مرحباً بعودتك",
    newResume: "سيرة ذاتية جديدة",
    resumeCompletion: "اكتمال السيرة الذاتية",
    atsImprovement: "تحسين ATS",
    aiUsage: "الاستخدام المتبقي للذكاء الاصطناعي",
    subscription: "الاشتراك",
    recentActivity: "النشاط الأخير",
    quickActions: "إجراءات سريعة",
    careerProgress: "التقدم المهني",
    coach: {
      greeting: "هل أنت مستعد للارتقاء بمسيرتك المهنية؟",
      tip1: "نصيحة: استخدم فاحص ATS لتحسين سيرتك الذاتية قبل التقديم.",
      tip2: "نصيحة: خطاب التقديم المخصص يزيد فرص المقابلة بنسبة ٤٠٪.",
      tip3: "هل تعلم؟ مسؤولو التوظيف يقضون متوسط ٧ ثوانٍ في مسح السيرة الذاتية.",
    },
    createResumeAI: "إنشاء سيرة ذاتية بالذكاء الاصطناعي",
    analyzeATS: "تحليل درجة ATS",
    checkJobMatch: "فحص تطابق الوظائف",
    generateCoverLetter: "إنشاء خطاب تقديم",
  },
  empty: {
    noResumes: "لنبدأ بإنشاء أول سيرة ذاتية احترافية لك.",
    noResumesDesc: "ابدأ من الصفر، أو ارفع سيرة ذاتية موجودة، أو دع الذكاء الاصطناعي ينشئها لك.",
    createResume: "إنشاء سيرة ذاتية",
    uploadResume: "رفع سيرة ذاتية",
    generateAI: "توليد بالذكاء الاصطناعي",
  },
  auth: {
    welcomeBack: "مرحباً بعودتك",
    signInTo: "تسجيل الدخول إلى حساب LITHY AI",
    signIn: "تسجيل الدخول",
    signingIn: "جاري تسجيل الدخول...",
    orContinueWith: "أو تابع بواسطة",
    forgotPassword: "نسيت كلمة المرور؟",
    noAccount: "ليس لديك حساب؟",
    signUp: "إنشاء حساب",
    createAccount: "إنشاء حساب جديد",
    startBuilding: "ابدأ ببناء سيرتك الذاتية الاحترافية مع LITHY AI",
    creating: "جاري إنشاء الحساب...",
    alreadyHaveAccount: "لديك حساب بالفعل؟",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    phone: "رقم الهاتف (اختياري)",
  },
};
