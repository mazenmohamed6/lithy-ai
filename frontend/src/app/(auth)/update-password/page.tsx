"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";

export default function UpdatePasswordPage() {
  const { t, locale } = useI18n();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error(locale === "ar" ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل" : "Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error(locale === "ar" ? "كلمة المرور غير متطابقة" : "Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      await api.post("/auth/update-password", { newPassword: password });
      toast.success(t("updatePassword.success"));
      router.push("/login");
    } catch (err: any) {
      toast.error(err.message || (locale === "ar" ? "فشل تحديث كلمة المرور" : "Failed to update password"));
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-[80vh] flex items-center justify-center py-12 ${locale === "ar" ? "text-right" : ""}`}>
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("updatePassword.title")}</CardTitle>
          <CardDescription>{t("updatePassword.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t("updatePassword.newPassword")}</Label>
              <Input id="password" type="password" placeholder={t("updatePassword.minLength")} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">{t("updatePassword.confirmPassword")}</Label>
              <Input id="confirm" type="password" placeholder={t("updatePassword.minLength")} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("updatePassword.updating") : t("updatePassword.update")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
