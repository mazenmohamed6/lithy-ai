"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, PLANS } from "@/lib/constants";
import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

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
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const isPaid = planParam && planParam !== "free";

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordError = useMemo(() => password ? validatePassword(password) : null, [password]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwError = validatePassword(password);
    if (pwError) { toast.error(pwError); return; }

    setIsLoading(true);
    try {
      const data = await api.post("/auth/signup", {
        email, password, phone: phone || undefined,
        metadata: { selectedPlan: planParam || "free" },
      });

      if (data.checkoutUrl) {
        toast.success("Account created! Redirecting to payment...");
        window.location.href = data.checkoutUrl;
      } else if (data.requiresVerification) {
        router.push("/verify-email");
      } else {
        toast.success(data.message || "Account created successfully! Welcome aboard.");
        router.push("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
      setIsLoading(false);
    }
  };

  const supabase = createClient();

  const handleOAuthSignup = async (provider: "google" | "linkedin" | "github" | "apple") => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      toast.error(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <CardDescription>
            {isPaid
              ? `Start your 7-day free trial of ${planParam!.charAt(0).toUpperCase() + planParam!.slice(1)}`
              : `Start building your professional resume with ${APP_NAME}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Min. 8 chars, upper, lower, digit, special" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" type="tel" placeholder="+20 100 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : isPaid ? `Start ${planParam!.charAt(0).toUpperCase() + planParam!.slice(1)} Trial` : "Create Account"}
            </Button>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => handleOAuthSignup("google")} disabled={isLoading}>Google</Button>
            <Button variant="outline" onClick={() => handleOAuthSignup("linkedin")} disabled={isLoading}>LinkedIn</Button>
            <Button variant="outline" onClick={() => handleOAuthSignup("github")} disabled={isLoading}>GitHub</Button>
            <Button variant="outline" onClick={() => handleOAuthSignup("apple")} disabled={isLoading}>Apple</Button>
          </div>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">Sign in</Link>
        </CardFooter>
      </Card>
    </div>
  );
}
