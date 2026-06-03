"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const [resending, setResending] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  const handleResend = async () => {
    setResending(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });
      if (error) toast.error(error.message);
      else { toast.success("Verification email resent!"); setDone(true); }
    } else {
      toast.error("No email found. Please sign up again.");
    }
    setResending(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
          <CardDescription>
            We sent a verification link to your email address.
            Please click the link to verify your account before signing in.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder or resend it below.
          </p>
          <Button variant="outline" className="w-full" onClick={handleResend} disabled={resending || done}>
            <RefreshCw className={`mr-2 h-4 w-4 ${resending ? "animate-spin" : ""}`} />
            {resending ? "Resending..." : done ? "Email Sent" : "Resend Verification Email"}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => router.push("/login")}>
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
