"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Smartphone } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface PhoneVerifyProps {
  phone: string;
  onVerified: () => void;
}

export function PhoneVerify({ phone, onVerified }: PhoneVerifyProps) {
  const { t, locale } = useI18n();
  const [step, setStep] = useState<"idle" | "sending" | "sent" | "verifying" | "verified">("idle");
  const [otp, setOtp] = useState("");
  const supabase = createClient();

  const handleSendCode = async () => {
    if (!phone || phone.length < 10) {
      toast.error(locale === "ar" ? "يرجى إدخال رقم هاتف صحيح" : "Please enter a valid phone number");
      return;
    }
    setStep("sending");
    const { error } = await supabase.auth.updateUser({ phone });
    if (error) {
      toast.error(error.message);
      setStep("idle");
      return;
    }
    setStep("sent");
    toast.success(locale === "ar" ? "تم إرسال رمز التحقق إلى هاتفك" : "Verification code sent to your phone");
  };

  const handleVerify = async () => {
    if (!otp || otp.length < 4) {
      toast.error(locale === "ar" ? "يرجى إدخال رمز التحقق" : "Please enter the verification code");
      return;
    }
    setStep("verifying");
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
    if (error) {
      toast.error(error.message || (locale === "ar" ? "رمز غير صحيح" : "Invalid code"));
      setStep("sent");
      return;
    }
    try {
      await api.post("/auth/phone/verify", { phone });
      setStep("verified");
      toast.success(locale === "ar" ? "تم التحقق من الهاتف بنجاح" : "Phone verified successfully");
      onVerified();
    } catch {
      toast.error(locale === "ar" ? "فشل تأكيد التحقق على الخادم" : "Failed to confirm verification on server");
      setStep("sent");
    }
  };

  if (step === "verified") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {locale === "ar" ? "تم التحقق" : "Verified"}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {step === "idle" || step === "sending" ? (
        <Button type="button" variant="outline" size="sm" onClick={handleSendCode} disabled={step === "sending"}>
          {step === "sending" ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Smartphone className="h-3 w-3 mr-1" />}
          {step === "sending" ? (locale === "ar" ? "جاري الإرسال..." : "Sending...") : (locale === "ar" ? "تحقق" : "Verify")}
        </Button>
      ) : (
        <>
          <Input
            type="text"
            inputMode="numeric"
            placeholder={locale === "ar" ? "أدخل الرمز" : "Enter code"}
            className="w-28 h-8 text-sm"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <Button type="button" size="sm" onClick={handleVerify} disabled={step === "verifying" || otp.length < 4}>
            {step === "verifying" ? <Loader2 className="h-3 w-3 animate-spin" /> : (locale === "ar" ? "تأكيد" : "Confirm")}
          </Button>
        </>
      )}
    </div>
  );
}
