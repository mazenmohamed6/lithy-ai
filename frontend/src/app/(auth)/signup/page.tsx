"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { getDeviceFingerprint, getBrowserFingerprint } from "@/lib/fingerprint";
import { toast } from "sonner";
import { Mail } from "lucide-react";

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  if (!password) return { label: "", color: "bg-gray-200", width: "0%" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (score <= 1) return { label: "Weak", color: "bg-red-500", width: "25%" };
  if (score <= 2) return { label: "Fair", color: "bg-orange-500", width: "50%" };
  if (score <= 3) return { label: "Good", color: "bg-yellow-500", width: "75%" };
  return { label: "Strong", color: "bg-green-500", width: "100%" };
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return "At least 8 characters";
  if (password.length > 128) return "Maximum 128 characters";
  if (!/[a-z]/.test(password)) return "Need a lowercase letter";
  if (!/[A-Z]/.test(password)) return "Need an uppercase letter";
  if (!/\d/.test(password)) return "Need a digit";
  if (!/[^a-zA-Z0-9]/.test(password)) return "Need a special character";
  return null;
}

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useI18n();
  const planParam = searchParams.get("plan");
  const isPaid = planParam && planParam !== "free";
  const planLabel = planParam ? planParam.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "";
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordError = useMemo(() => password ? validatePassword(password) : null, [password]);
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwError = validatePassword(password);
    if (pwError) { toast.error(pwError); return; }
    if (password !== confirmPassword) { toast.error(locale === "ar" ? "كلمة المرور غير متطابقة" : "Passwords do not match"); return; }
    setIsLoading(true);
    try {
      const data = await api.post("/auth/signup", {
        email, password, phone: phone || undefined,
        metadata: {
          selectedPlan: planParam || "free",
          deviceFingerprint: getDeviceFingerprint(),
          browserFingerprint: getBrowserFingerprint(),
        },
      });
      if (data.checkoutUrl) {
        toast.success(locale === "ar" ? "تم إنشاء الحساب! جاري التوجيه للدفع..." : "Account created! Redirecting to payment...");
        window.location.href = data.checkoutUrl;
      } else {
        toast.success(data.message || (locale === "ar" ? "تم إنشاء الحساب! يرجى تسجيل الدخول." : "Account created! Please sign in."));
        router.push("/login");
      }
    } catch (err: any) {
      toast.error(err.message || (locale === "ar" ? "فشل إنشاء الحساب" : "Signup failed"));
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    const nextPath = planParam ? `/billing?plan=${planParam}` : '/dashboard';
    // Store fingerprint in cookie for callback to read
    document.cookie = `lithy_fp=${encodeURIComponent(JSON.stringify({ device: getDeviceFingerprint(), browser: getBrowserFingerprint() }))};path=/;max-age=300`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` },
    });
    if (error) { toast.error(error.message); setIsLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("auth.createAccount")}</CardTitle>
          <CardDescription>
            {isPaid ? `Subscribe to ${planLabel}` : t("auth.startBuilding")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="default" size="lg" onClick={handleGoogleSignup} disabled={isLoading} className="w-full gap-3 h-12 text-base">
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            {t("auth.signUpWithGoogle")}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center">
              <button type="button" onClick={() => setShowEmailForm(!showEmailForm)} className="bg-card px-3 text-xs uppercase text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <Mail className="h-3 w-3" />
                {t("auth.orEmail")}
              </button>
            </div>
          </div>

          {showEmailForm && (
            <form onSubmit={handleSignup} className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input id="password" type="password" placeholder="Min. 8 chars, upper, lower, digit, special" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
                {password && (
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full ${passwordStrength.color} transition-all duration-300`} style={{ width: passwordStrength.width }} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">{passwordStrength.label}</span>
                      {passwordError && <span className="text-xs text-destructive">{passwordError}</span>}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                <Input id="confirmPassword" type="password" placeholder="Re-enter your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("auth.phone")}</Label>
                <Input id="phone" type="tel" placeholder="+20 100 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading} variant="outline">
                {isLoading ? t("auth.creating") : isPaid ? `Subscribe to ${planLabel}` : t("auth.signUp")}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          {t("auth.alreadyHaveAccount")}{" "}
          <Link href="/login" className="text-primary hover:underline">{t("auth.signIn")}</Link>
        </CardFooter>
      </Card>
    </div>
  );
}
