import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/providers/theme-provider";
import { SupabaseProvider } from "@/providers/supabase-provider";
import { I18nProvider } from "@/lib/i18n/context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LITHY AI",
  applicationCategory: "CareerApplication",
  operatingSystem: "Web",
  description: "AI-Powered Resume Builder for Egypt and the MENA region. Create professional, ATS-optimized resumes and cover letters.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EGP",
  },
  author: {
    "@type": "Organization",
    name: "LITHY AI",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does LITHY AI help with ATS optimization?",
      acceptedAnswer: { "@type": "Answer", text: "LITHY AI analyzes your resume against ATS algorithms used by top companies in Egypt and the MENA region, providing specific recommendations to improve your score." },
    },
    {
      "@type": "Question",
      name: "Does LITHY AI support Arabic resumes?",
      acceptedAnswer: { "@type": "Answer", text: "Yes, LITHY AI fully supports bilingual resumes in English and Arabic with proper RTL formatting, optimized for platforms like Wuzzuf and Bayt." },
    },
    {
      "@type": "Question",
      name: "Is LITHY AI free to use?",
      acceptedAnswer: { "@type": "Answer", text: "LITHY AI offers a free plan with basic resume building tools. Paid plans start at 75 EGP/month with a 7-day free trial." },
    },
  ],
};

export const metadata: Metadata = {
  title: "LITHY AI - AI-Powered Resume Builder for Egypt & MENA",
  description: "Create professional, ATS-optimized resumes and cover letters with AI. Built for Egyptian and MENA job seekers. Arabic & English support.",
  keywords: "AI Resume Builder, ATS Resume Checker, Resume Generator, سيرة ذاتية بالذكاء الاصطناعي, فحص ATS, منشئ السيرة الذاتية, Egypt, MENA",
  openGraph: {
    title: "LITHY AI - AI-Powered Resume Builder",
    description: "Create professional resumes with AI. Get ATS-optimized, job-winning resumes in minutes. Built for Egypt & MENA.",
    type: "website",
    locale: "en_US",
    siteName: "LITHY AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "LITHY AI - AI Resume Builder",
    description: "Build ATS-optimized resumes with AI. Arabic & English support. Built for Egypt & MENA.",
  },
  robots: { index: true, follow: true },
  alternates: {
    languages: { en: "/en", ar: "/ar" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <ThemeProvider>
          <SupabaseProvider>
            <I18nProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <Toaster richColors position="top-right" />
            </I18nProvider>
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
