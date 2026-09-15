"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

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

  // Don't show nav on onboarding page
  const isOnboarding = pathname === "/" || pathname === "/onboarding";
  if (isOnboarding) {
    return <>{children}</>;
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
