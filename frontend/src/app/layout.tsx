import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/providers/theme-provider";
import { SupabaseProvider } from "@/providers/supabase-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "LITHY AI - AI-Powered Resume Builder",
  description: "Create professional resumes, cover letters, and optimize your LinkedIn profile with AI.",
  keywords: "resume builder, AI resume, cover letter, ATS score, job search, career",
  openGraph: {
    title: "LITHY AI - AI-Powered Resume Builder",
    description: "Create professional resumes with AI. Get ATS-optimized, job-winning resumes in minutes.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <ThemeProvider>
          <SupabaseProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster richColors position="top-right" />
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
