"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { useProfile } from "@/hooks/use-profile";
import { useRealtime } from "@/hooks/use-realtime";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const router = useRouter();
  const { profile, isLoading: isProfileLoading, hasProfile } = useProfile();

  // Connect Supabase Realtime synchronization only when user is authenticated
  useRealtime();

  // Load saved collapse state
  useEffect(() => {
    const saved = localStorage.getItem("planify-sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("planify-sidebar-collapsed", String(next));
      return next;
    });
  };

  // Don't show nav on onboarding or root page
  const isOnboarding = pathname === "/" || pathname === "/onboarding";

  useEffect(() => {
    if (!isOnboarding && !isProfileLoading && !hasProfile) {
      router.replace("/onboarding");
    }
  }, [isOnboarding, isProfileLoading, hasProfile, router]);

  if (isOnboarding) {
    return <>{children}</>;
  }

  // Show clean loading state while verifying user identity
  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, do not render workspace
  if (!hasProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={toggleCollapse} />
      <main
        className={cn(
          "transition-all duration-300 ease-in-out min-h-screen pb-20 md:pb-0",
          collapsed ? "md:ml-[68px]" : "md:ml-[240px]"
        )}
      >
        <div className="page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
