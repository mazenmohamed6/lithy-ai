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
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    if (data.user) {
      api.post("/auth/sync", { userId: data.user.id, email: data.user.email }).catch(() => {});
    }

    toast.success("Welcome back!");
    router.push("/dashboard");
  };

  const handleOAuthLogin = async (provider: "google" | "linkedin" | "github" | "apple") => {
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
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your {APP_NAME} account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => handleOAuthLogin("google")} disabled={isLoading}>Google</Button>
            <Button variant="outline" onClick={() => handleOAuthLogin("linkedin")} disabled={isLoading}>LinkedIn</Button>
            <Button variant="outline" onClick={() => handleOAuthLogin("github")} disabled={isLoading}>GitHub</Button>
            <Button variant="outline" onClick={() => handleOAuthLogin("apple")} disabled={isLoading}>Apple</Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-sm">
          <Link href="/reset-password" className="text-primary hover:underline">Forgot password?</Link>
          <div className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">Sign up</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
