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
import { Loader2, User, Shield, Bell, CreditCard, LogOut, Globe } from "lucide-react";

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
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.signInWithPassword({ email: user?.email || "", password: currentPassword });
    if (error) {
      toast.error("Current password is incorrect");
      setIsUpdatingPassword(false);
      return;
    }
    try {
      await api.post("/auth/update-password", { newPassword });
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This will permanently delete all your data.")) return;
    try {
      await api.post("/auth/delete-account");
      await signOut();
      toast.success("Account deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account");
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className={`container py-8 max-w-3xl ${locale === "ar" ? "text-right" : ""}`}>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{locale === "ar" ? "الإعدادات" : "Settings"}</h1>
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
          <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" /> {locale === "ar" ? "الملف الشخصي" : "Profile"}</TabsTrigger>
          <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" /> {locale === "ar" ? "الأمان" : "Security"}</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" /> {locale === "ar" ? "الإشعارات" : "Notifications"}</TabsTrigger>
          <TabsTrigger value="billing"><CreditCard className="mr-2 h-4 w-4" /> {locale === "ar" ? "الفواتير" : "Billing"}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={profile.fullName || ""} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={profile.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={profile.location || ""} onChange={(e) => setProfile({ ...profile, location: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Input value={profile.jobTitle || ""} onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input value={profile.company || ""} onChange={(e) => setProfile({ ...profile, company: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn URL</Label>
                  <Input value={profile.linkedinUrl || ""} onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={profile.website || ""} onChange={(e) => setProfile({ ...profile, website: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <textarea className="w-full min-h-[100px] rounded-md border border-input bg-transparent p-3 text-sm" value={profile.bio || ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
              </div>
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your password and account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input type="password" placeholder="Enter current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" placeholder="Min. 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleUpdatePassword} disabled={isUpdatingPassword}>
                {isUpdatingPassword ? "Updating..." : "Update Password"}
              </Button>
              <div className="pt-6 border-t">
                <Button variant="destructive" onClick={handleDeleteAccount}>Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Email Preferences</CardTitle>
              <CardDescription>Choose which emails you receive</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Email preference management coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

          <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>Manage your subscription and payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Manage your billing through the <a href="/billing" className="text-primary hover:underline">Billing page</a>.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="font-medium">{locale === "ar" ? "تسجيل الخروج" : "Sign Out"}</p>
            <p className="text-sm text-muted-foreground">{locale === "ar" ? "تسجيل الخروج من حسابك" : "Sign out of your account"}</p>
          </div>
          <Button variant="outline" onClick={() => { signOut(); window.location.href = "/"; }}>
            <LogOut className="mr-2 h-4 w-4" /> {locale === "ar" ? "تسجيل الخروج" : "Log Out"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
