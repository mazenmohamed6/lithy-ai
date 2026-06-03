"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import { APP_NAME } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/context";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { t, locale } = useI18n();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error(error.message); setIsLoading(false); return; }
    if (data.user) { api.post("/auth/sync", { userId: data.user.id, email: data.user.email }).catch(() => {}); }
    toast.success(locale === "ar" ? "مرحباً بعودتك!" : "Welcome back!");
    router.push("/dashboard");
  };

  const handleOAuthLogin = async (provider: "google" | "github") => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/dashboard')}` },
    });
    if (error) { toast.error(error.message); setIsLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("auth.welcomeBack")}</CardTitle>
          <CardDescription>{t("auth.signInTo")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("auth.signingIn") : t("auth.signIn")}
            </Button>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">{t("auth.orContinueWith")}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => handleOAuthLogin("google")} disabled={isLoading}>Google</Button>
            <Button variant="outline" onClick={() => handleOAuthLogin("github")} disabled={isLoading}>GitHub</Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-sm">
          <Link href="/reset-password" className="text-primary hover:underline">{t("auth.forgotPassword")}</Link>
          <div className="text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <Link href="/signup" className="text-primary hover:underline">{t("auth.signUp")}</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
