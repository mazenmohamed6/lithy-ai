"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Sparkles, BarChart3, Target, Linkedin, CreditCard, Settings, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resumes", label: "Resumes", icon: FileText },
  { href: "/ats-scanner", label: "ATS Scanner", icon: BarChart3 },
  { href: "/job-match", label: "Job Match", icon: Target },
  { href: "/cover-letters", label: "Cover Letters", icon: Sparkles },
  { href: "/linkedin", label: "LinkedIn", icon: Linkedin },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="hidden md:flex w-64 flex-col border-r bg-muted/30">
        <div className="p-4 border-b">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Navigation</p>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-0.5"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <p className="text-xs text-muted-foreground">LITHY AI v1.0</p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
