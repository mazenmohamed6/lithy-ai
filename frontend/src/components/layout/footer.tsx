"use client";

import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/context";

export function Footer() {
  const { t, locale } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">L</span>
              </div>
              <span className="text-base font-bold">{APP_NAME}</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {t("footer.description")}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">{t("footer.product")}</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link href="/features" className="hover:text-foreground transition-colors">{t("nav.features")}</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground transition-colors">{t("nav.pricing")}</Link></li>
              <li><Link href="/templates" className="hover:text-foreground transition-colors">Templates</Link></li>
              <li><Link href="/referral" className="hover:text-foreground transition-colors">{t("auth.referral")}</Link></li>
              <li><Link href="/changelog" className="hover:text-foreground transition-colors">Changelog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">{t("footer.company")}</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground transition-colors">{t("nav.about")}</Link></li>
              <li><Link href="/blog" className="hover:text-foreground transition-colors">{t("nav.blog")}</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">{t("footer.legal")}</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
              <li><Link href="/cookies" className="hover:text-foreground transition-colors">Cookies</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {year} {APP_NAME}. {t("footer.copyright")}</p>
          <p className="text-xs">{locale === "ar" ? "صنع في مصر " : "Made in Egypt"}</p>
        </div>
      </div>
    </footer>
  );
}
