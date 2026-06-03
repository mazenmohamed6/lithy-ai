"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function ResetPasswordPage() {
  const { t, locale } = useI18n();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();
  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=update-password`,
    });
    if (error) { toast.error(error.message); setIsLoading(false); return; }
    setSent(true);
    setIsLoading(false);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 ${locale === "ar" ? "text-right" : ""}`}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("resetPassword.title")}</CardTitle>
          <CardDescription>{t("resetPassword.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-green-600 font-medium">{t("resetPassword.checkEmail")}</p>
              <p className="text-sm text-muted-foreground">{t("resetPassword.sentTo")} <strong>{email}</strong></p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("resetPassword.email")}</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("resetPassword.sending") : t("resetPassword.sendReset")}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <BackIcon className="h-4 w-4" /> {t("resetPassword.backToLogin")}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
