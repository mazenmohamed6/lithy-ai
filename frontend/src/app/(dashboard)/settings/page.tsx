"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabase } from "@/providers/supabase-provider";
import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { toast } from "sonner";
import { PhoneVerify } from "@/components/phone-verify";
import { Loader2, User, Shield, Bell, CreditCard, LogOut, Globe, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { user, signOut } = useSupabase();
  const { locale, setLocale, t } = useI18n();
  const [profile, setProfile] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    api.get("/users/profile")
      .then(setProfile)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await api.put("/users/profile", profile);
      toast.success(t("settings.profileUpdated"));
    } catch (err: any) {
      toast.error(err.message || t("settings.profileUpdateFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 8) {
      toast.error(t("settings.passwordMinLength"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("settings.passwordMismatch"));
      return;
    }
    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.signInWithPassword({ email: user?.email || "", password: currentPassword });
    if (error) {
      toast.error(t("settings.passwordIncorrect"));
      setIsUpdatingPassword(false);
      return;
    }
    try {
      await api.post("/auth/update-password", { newPassword });
      toast.success(t("settings.passwordUpdated"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || t("settings.passwordUpdateFailed"));
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t("settings.deleteConfirm"))) return;
    try {
      await api.post("/auth/delete-account");
      await signOut();
      toast.success(t("settings.accountDeleted"));
    } catch (err: any) {
      toast.error(err.message || t("settings.accountDeleteFailed"));
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className={`container py-8 max-w-3xl ${locale === "ar" ? "text-right" : ""}`}>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t("settings.title")}</h1>
        <button
          onClick={() => setLocale(locale === "en" ? "ar" : "en")}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border bg-background hover:bg-accent transition-colors"
        >
          <Globe className="size-3.5" />
          <span>{locale === "en" ? "AR" : "EN"}</span>
        </button>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className={`mb-8 ${locale === "ar" ? "flex-row-reverse" : ""}`}>
          <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" /> {t("settings.profile")}</TabsTrigger>
          <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" /> {t("settings.security")}</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" /> {t("settings.notifications")}</TabsTrigger>
          <TabsTrigger value="billing"><CreditCard className="mr-2 h-4 w-4" /> {t("settings.billing")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.personalInfo")}</CardTitle>
              <CardDescription>{t("settings.personalInfoDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("settings.fullName")}</Label>
                  <Input value={profile.fullName || ""} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.email")}</Label>
                  <Input value={user?.email || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.phone")}</Label>
                  <div className="flex items-center gap-2">
                    <Input value={profile.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="flex-1" />
                    {profile.phone && <PhoneVerify phone={profile.phone} onVerified={() => setProfile({ ...profile, phoneVerified: true })} />}
                    {profile.phoneVerified && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {t("settings.verified")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.location")}</Label>
                  <Input value={profile.location || ""} onChange={(e) => setProfile({ ...profile, location: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.jobTitle")}</Label>
                  <Input value={profile.jobTitle || ""} onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.company")}</Label>
                  <Input value={profile.company || ""} onChange={(e) => setProfile({ ...profile, company: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.linkedinUrl")}</Label>
                  <Input value={profile.linkedinUrl || ""} onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.website")}</Label>
                  <Input value={profile.website || ""} onChange={(e) => setProfile({ ...profile, website: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("settings.bio")}</Label>
                <textarea className="w-full min-h-[100px] rounded-md border border-input bg-transparent p-3 text-sm" value={profile.bio || ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
              </div>
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? t("settings.saving") : t("settings.saveChanges")}
              </Button>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="font-medium">{t("settings.signOut")}</p>
                <p className="text-sm text-muted-foreground">{t("settings.signOutDesc")}</p>
              </div>
                <Button variant="outline" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" /> {t("settings.logOut")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.security")}</CardTitle>
              <CardDescription>{t("settings.securityTabDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("settings.currentPassword")}</Label>
                <Input type="password" placeholder={t("settings.placeholderCurrentPw")} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("settings.newPassword")}</Label>
                  <Input type="password" placeholder={t("settings.placeholderNewPw")} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.confirmPassword")}</Label>
                  <Input type="password" placeholder={t("settings.placeholderConfirmPw")} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleUpdatePassword} disabled={isUpdatingPassword}>
                {isUpdatingPassword ? t("settings.updating") : t("settings.updatePassword")}
              </Button>
              <div className="pt-6 border-t">
                <Button variant="destructive" onClick={handleDeleteAccount}>{t("settings.deleteAccount")}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.emailPrefs")}</CardTitle>
              <CardDescription>{t("settings.emailPrefsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t("settings.comingSoon")}</p>
            </CardContent>
          </Card>
        </TabsContent>

          <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.billing")}</CardTitle>
              <CardDescription>{t("settings.billingDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{locale === "ar" ? "يمكنك إدارة فواتيرك من خلال" : "Manage your billing through the"} <a href="/billing" className="text-primary hover:underline">{t("settings.billingPage")}</a>.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}
