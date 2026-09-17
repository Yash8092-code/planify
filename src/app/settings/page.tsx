"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Globe,
  Bell,
  Sun,
  Moon,
  Laptop,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { RollbackManagerDialog } from "@/components/checklist/rollback-manager";
import { useProfile } from "@/hooks/use-profile";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export default function SettingsPage() {
  const router = useRouter();
  const { profile, isLoading, mutate } = useProfile();
  const { theme, setTheme } = useTheme();

  // Profile form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Reset dialog state
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  // Rollback dialog
  const [isRollbackOpen, setIsRollbackOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setEmail(profile.email || "");
      setTimezone(profile.timezone || "Asia/Kolkata");
      setEmailNotifications(profile.email_notifications ?? true);
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Name and valid email are required");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          timezone,
          email_notifications: emailNotifications,
          theme,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update profile");

      toast.success("Profile preferences saved!");
      mutate();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetProfile = async () => {
    if (confirmText.trim().toUpperCase() !== "RESET") {
      toast.error("Please type RESET to confirm");
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to reset profile");

      toast.success("Profile and data reset. Starting fresh!");
      setIsResetOpen(false);
      router.push("/onboarding");
    } catch (err) {
      toast.error("Failed to reset profile");
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your account profile, timezone, notification habits, and display theme
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Profile Details Card */}
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Personal Profile
            </CardTitle>
            <CardDescription className="text-xs">
              Your name and primary notification email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="timezone" className="text-xs font-medium flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                Timezone (Daily Rollover & 5:00 AM Emails)
              </Label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {!TIMEZONES.includes(timezone) && (
                  <option value={timezone}>{timezone} (Current)</option>
                )}
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Preferences & Notifications */}
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Notifications & Email
            </CardTitle>
            <CardDescription className="text-xs">
              Control daily productivity briefings and task milestone emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl border bg-card/60">
              <div className="space-y-0.5 pr-4">
                <p className="text-sm font-medium">Daily Productivity Emails</p>
                <p className="text-xs text-muted-foreground">
                  Receive a morning checklist summary at 5:00 AM and a celebration email when you hit 100% completion.
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
                aria-label="Toggle email notifications"
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance / Theme */}
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sun className="h-4 w-4 text-primary" />
              Display Theme
            </CardTitle>
            <CardDescription className="text-xs">
              Choose your preferred interface appearance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "light", label: "Light", icon: Sun },
                { id: "dark", label: "Dark", icon: Moon },
                { id: "system", label: "System", icon: Laptop },
              ].map((t) => {
                const isSelected = theme === t.id;
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id as "light" | "dark" | "system")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/30"
                        : "border-border hover:border-primary/40 hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} className="gap-1.5">
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </form>

      {/* Rollback Daily Quick Link */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Rollback Daily Habits</h3>
              <p className="text-xs text-muted-foreground">
                Manage all your recurring task templates that auto-reset daily.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRollbackOpen(true)}
            className="text-xs gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Open Rollback Manager
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30 bg-destructive/5 shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-xs text-destructive/80">
            Irreversible actions that delete your profile and wipe data
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Reset Profile & Erase Data</p>
            <p className="text-xs text-muted-foreground">
              Permanently removes your profile, tasks, notes, and uploaded documents.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setConfirmText("");
              setIsResetOpen(true);
            }}
            className="text-xs shrink-0 self-start sm:self-auto"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Reset Profile
          </Button>
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Complete Profile Reset
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              This action cannot be undone. All tasks, recurring habits, notes, and documents will be permanently purged.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-xs font-medium">
              Type <span className="font-mono font-bold text-destructive">RESET</span> below to confirm:
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESET"
              className="h-10 border-destructive/40"
              autoFocus
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResetOpen(false)}
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleResetProfile}
              disabled={isResetting || confirmText.trim().toUpperCase() !== "RESET"}
            >
              {isResetting ? "Purging..." : "Confirm & Reset All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rollback Dialog */}
      <RollbackManagerDialog
        isOpen={isRollbackOpen}
        onClose={() => setIsRollbackOpen(false)}
      />
    </div>
  );
}
