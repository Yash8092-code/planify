"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, ArrowLeft, BarChart3, Settings } from "lucide-react";

export function MobileHeader() {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname.startsWith("/statistics")) return "Analytics";
    if (pathname.startsWith("/checklist")) return "Checklist";
    if (pathname.startsWith("/notes")) return "Notes";
    if (pathname.startsWith("/documents")) return "Documents";
    if (pathname.startsWith("/settings")) return "Settings";
    return "Planify";
  };

  const isHome = pathname === "/dashboard" || pathname === "/";

  return (
    <header className="md:hidden sticky top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-b border-border/80 px-4 h-14 flex items-center justify-between shadow-xs">
      {isHome ? (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-primary shadow-xs">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight gradient-text">Planify</span>
        </div>
      ) : (
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground py-1 px-2 -ml-2 rounded-lg hover:bg-secondary/60 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
      )}

      {/* Center Title for subpages */}
      {!isHome && (
        <span className="font-semibold text-sm tracking-tight text-foreground truncate max-w-[140px]">
          {getPageTitle()}
        </span>
      )}

      {/* Right Action Button */}
      <div className="flex items-center gap-1.5">
        {pathname !== "/statistics" && (
          <Link
            href="/statistics"
            className="flex items-center gap-1.5 text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1.5 rounded-lg transition-colors"
            title="View Statistics"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Stats</span>
          </Link>
        )}
        {pathname === "/statistics" && (
          <Link
            href="/settings"
            className="flex items-center text-muted-foreground hover:text-foreground p-1.5 rounded-lg"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Link>
        )}
      </div>
    </header>
  );
}
