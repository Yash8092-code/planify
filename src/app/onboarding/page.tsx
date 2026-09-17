"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Mail, User, KeyRound, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { detectTimezone } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "otp">("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; otp?: string }>({});

  const validateDetails = () => {
    const newErrors: { name?: string; email?: string } = {};
    if (!name.trim()) newErrors.name = "Please enter your name";
    if (!email.trim()) newErrors.email = "Please enter your email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Please enter a valid email";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOtp = () => {
    const newErrors: { otp?: string } = {};
    const clean = otp.trim();
    if (!clean) newErrors.otp = "Please enter the 4-digit verification code";
    else if (clean.length !== 4) newErrors.otp = "Code must be exactly 4 digits";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDetails()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to send verification code");

      setIsExistingUser(json.exists);
      setStep("otp");
      toast.success(
        json.exists
          ? "Welcome back! Enter the 4-digit code sent to your email to sync this device."
          : "4-digit verification code sent to your email!"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to proceed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateOtp()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          token: otp.trim(),
          name: name.trim(),
          timezone: detectTimezone() || "Asia/Kolkata",
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Invalid verification code");

      // Set session on browser client to ensure realtime tokens match
      const supabase = createClient();
      if (json.session) {
        await supabase.auth.setSession(json.session);
      }
      await supabase.auth.refreshSession();

      toast.success(isExistingUser ? "Workspace synced! 🎉" : "Welcome to Planify! 🎉");
      window.location.href = "/dashboard";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to resend code");
      toast.success("New verification code sent!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-md mx-4"
      >
        <div className="glass rounded-3xl p-8 md:p-10 shadow-2xl">
          {/* Logo & Title */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex flex-col items-center mb-8"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
              {step === "details" ? (
                <>
                  Welcome to <span className="gradient-text">Planify</span>
                </>
              ) : (
                <>
                  Verify <span className="gradient-text">Device</span>
                </>
              )}
            </h1>
            <p className="text-muted-foreground text-center text-sm">
              {step === "details"
                ? "Let's set up your personal productivity companion."
                : `Enter the 4-digit verification code sent to ${email}`}
            </p>
          </motion.div>

          {/* Form Step 1: Details */}
          <AnimatePresence mode="wait">
            {step === "details" ? (
              <motion.form
                key="details-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSendOtp}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="onboarding-name" className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Full Name
                  </Label>
                  <Input
                    id="onboarding-name"
                    placeholder="e.g. Yash Thakur"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                    autoFocus
                    autoComplete="name"
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive mt-1">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="onboarding-email" className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Email Address
                  </Label>
                  <Input
                    id="onboarding-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive mt-1">{errors.email}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  className="w-full mt-6"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending code...
                    </div>
                  ) : (
                    <span className="flex items-center gap-2">
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </motion.form>
            ) : (
              /* Form Step 2: OTP Verification */
              <motion.form
                key="otp-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleVerifyOtp}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="onboarding-otp" className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                      4-Digit Verification Code
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep("details")}
                      className="text-xs text-primary hover:underline"
                    >
                      Change email
                    </button>
                  </Label>
                  <Input
                    id="onboarding-otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    placeholder="1234"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setOtp(val);
                      if (errors.otp) setErrors((prev) => ({ ...prev, otp: undefined }));
                    }}
                    className={`text-center tracking-[0.5em] text-2xl font-mono font-bold ${
                      errors.otp ? "border-destructive focus-visible:ring-destructive" : ""
                    }`}
                    autoFocus
                    autoComplete="one-time-code"
                  />
                  {errors.otp && (
                    <p className="text-xs text-destructive text-center mt-1">{errors.otp}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  className="w-full mt-6"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </div>
                  ) : (
                    <span className="flex items-center gap-2">
                      Verify & Sync Workspace
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>

                <div className="flex items-center justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Didn&apos;t get the code? Resend
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-[11px] text-muted-foreground text-center mt-6">
            Planify secures your workspace across all your devices.
            <br />
            No passwords to remember.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
