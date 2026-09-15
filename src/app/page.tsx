"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/use-profile";

export default function HomePage() {
  const router = useRouter();
  const { profile, isLoading, hasProfile } = useProfile();

  useEffect(() => {
    if (isLoading) return;
    if (hasProfile && profile) {
      router.replace("/dashboard");
    } else {
      router.replace("/onboarding");
    }
  }, [isLoading, hasProfile, profile, router]);

  // Show loading state while checking profile
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading Planify...</p>
      </div>
    </div>
  );
}
