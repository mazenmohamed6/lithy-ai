"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSupabase } from "@/providers/supabase-provider";
import { APP_NAME } from "@/lib/constants";
import { useI18n, type Locale } from "@/lib/i18n/context";
import { Menu, X, Globe, ChevronDown } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const { user } = useSupabase();
  const { locale, setLocale, t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/resumes") || pathname.startsWith("/settings") || pathname.startsWith("/ats-scanner") || pathname.startsWith("/cover-letters");

  if (isAuthPage) return null;

  const navLinks = isDashboard
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/ats-scanner", label: "ATS Scanner" },
        { href: "/cover-letters", label: "Cover Letters" },
        { href: "/blog", label: "Blog" },
      ]
    : [
        { href: "/features", label: t("nav.features") },
        { href: "/pricing", label: t("nav.pricing") },
        { href: "/blog", label: t("nav.blog") },
        { href: "/about", label: t("nav.about") },
      ];

  const toggleLocale = () => {
    setLocale(locale === "en" ? "ar" : "en");
  };

  const otherLocale = locale === "en" ? "AR" : "EN";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">L</span>
            </div>
            <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLocale}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border bg-background hover:bg-accent transition-colors"
            aria-label={t("nav.language")}
          >
            <Globe className="size-3.5" />
            <span>{otherLocale}</span>
          </button>
          {user ? (
            <div className="hidden md:flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="default" size="sm">
                  {t("nav.dashboard")}
                </Button>
              </Link>
              <Avatar className="size-8 cursor-pointer ring-2 ring-border hover:ring-primary transition-all">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="text-xs">{user.email?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  {t("nav.signIn")}
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="shadow-sm">
                  {t("nav.getStarted")}
                </Button>
              </Link>
            </div>
          )}
          <button
            className="md:hidden p-2 -mr-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t bg-background animate-fade-in">
          <div className="container py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-2" />
            {user ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-primary"
              >
                {t("nav.dashboard")}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 text-sm"
                >
                  {t("nav.signIn")}
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-primary"
                >
                  {t("nav.getStarted")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
