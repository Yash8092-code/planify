"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  StickyNote,
  FolderOpen,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/checklist", label: "Tasks", icon: CheckSquare },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/documents", label: "Docs", icon: FolderOpen },
  { href: "/statistics", label: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl">
      <div className="flex items-center justify-between h-16 px-1.5 pb-[env(safe-area-inset-bottom,0px)]">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl transition-all duration-200 flex-1 min-w-[44px]",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              <div className="relative flex items-center justify-center">
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isActive ? "text-primary scale-110" : "text-muted-foreground"
                  )}
                />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] tracking-tight truncate max-w-full",
                  isActive ? "text-primary font-bold" : "text-muted-foreground font-medium"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
