"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Sparkles, BarChart3, Target, Linkedin, CreditCard, Settings, LayoutDashboard, Menu, X, HelpCircle, Wand2, FileCheck, Compass, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

const sidebarLinkDefs = [
  { href: "/dashboard", key: "sidebar.dashboard", icon: LayoutDashboard },
  { href: "/resumes", key: "sidebar.resumes", icon: FileText },
  { href: "/ats-scanner", key: "sidebar.atsScanner", icon: BarChart3 },
  { href: "/job-match", key: "sidebar.jobMatch", icon: Target },
  { href: "/cover-letters", key: "sidebar.coverLetters", icon: Sparkles },
  { href: "/interview-questions", key: "sidebar.interviewQuestions", icon: HelpCircle },
  { href: "/resume-tailor", key: "sidebar.resumeTailor", icon: Wand2 },
  { href: "/resume-review", key: "sidebar.resumeReview", icon: FileCheck },
  { href: "/career-advisor", key: "sidebar.careerAdvisor", icon: Compass },
  { href: "/portfolio-review", key: "sidebar.portfolioReview", icon: Globe },
  { href: "/linkedin", key: "sidebar.linkedin", icon: Linkedin },
  { href: "/billing", key: "sidebar.billing", icon: CreditCard },
  { href: "/settings", key: "sidebar.settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useI18n();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-20 left-3 z-50 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={t("header.toggleNavigation")}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed md:static z-40 inset-y-0 left-0 w-64 flex-col border-r bg-muted/30 transition-transform duration-300 md:flex",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}>
        <div className="p-4 border-b flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("sidebar.navigation")}</p>
          <Button variant="ghost" size="icon" className="md:hidden h-6 w-6" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {sidebarLinkDefs.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-0.5"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {t(link.key)}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <p className="text-xs text-muted-foreground">LITHY AI v1.0</p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
