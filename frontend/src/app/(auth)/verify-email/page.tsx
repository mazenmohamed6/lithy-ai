"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const { t, locale } = useI18n();
  const [resending, setResending] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  const handleResend = async () => {
    setResending(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const { error } = await supabase.auth.resend({ type: 'signup', email: user.email });
      if (error) toast.error(error.message);
      else { toast.success(locale === "ar" ? "تم إعادة إرسال البريد!" : "Verification email resent!"); setDone(true); }
    } else {
      toast.error(locale === "ar" ? "لم يتم العثور على البريد الإلكتروني" : "No email found. Please sign up again.");
    }
    setResending(false);
  };

  return (
    <div className={`min-h-[80vh] flex items-center justify-center ${locale === "ar" ? "text-right" : ""}`}>
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t("verifyEmail.title")}</CardTitle>
          <CardDescription>
            {t("verifyEmail.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("verifyEmail.help")}
          </p>
          <Button variant="outline" className="w-full gap-2" onClick={handleResend} disabled={resending || done}>
            <RefreshCw className={`h-4 w-4 ${resending ? "animate-spin" : ""}`} />
            {resending ? t("verifyEmail.resending") : done ? t("verifyEmail.emailSent") : t("verifyEmail.resend")}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => router.push("/login")}>
            {t("verifyEmail.backToSignIn")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
